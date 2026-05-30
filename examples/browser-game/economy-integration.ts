/**
 * Pharos Game Economy — Browser Game Integration
 *
 * Drop this file into any browser game to connect it to the Pharos reward economy.
 * The game server signs reward transactions; players claim tokens via the dashboard.
 */

import { ethers } from "ethers";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EconomyConfig {
  rewardEngineAddress: string;
  chainId: number;
  rpcUrl: string;
  serverSignerPrivateKey?: string; // Only on game server — never expose to browser
}

export interface RewardRequest {
  player: string;
  amount: string; // in whole tokens, e.g. "10"
  rewardType: "kill" | "quest" | "achievement" | "levelup" | "daily" | string;
  rewardId: string; // unique ID from your game server
}

export interface PlayerEconomyState {
  walletAddress: string | null;
  tokenBalance: bigint;
  pendingRewards: bigint;
  canClaimDaily: boolean;
  nextDailyClaimTime: Date | null;
}

// ── RewardEngine ABI (minimal) ─────────────────────────────────────────────────

const REWARD_ENGINE_ABI = [
  "function rewardPlayer(address player, uint256 amount, string calldata rewardType, bytes32 rewardId) external",
  "function rewardBatch((address player, uint256 amount, string reason)[] calldata entries) external",
  "function claimDailyReward() external",
  "function claimReward() external",
  "function getPendingRewards(address player) external view returns (uint256)",
  "function canClaimDaily(address player) external view returns (bool canClaim, uint256 nextClaimTime)",
  "event RewardGranted(address indexed player, uint256 amount, string rewardType, bytes32 indexed rewardId)",
  "event RewardClaimed(address indexed player, uint256 amount, uint256 timestamp)",
] as const;

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
] as const;

// ── Server-side: grant rewards ─────────────────────────────────────────────────

export class GameRewardServer {
  private engine: ethers.Contract;
  private provider: ethers.JsonRpcProvider;

  constructor(
    private readonly config: EconomyConfig & { serverSignerPrivateKey: string }
  ) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(config.serverSignerPrivateKey, this.provider);
    this.engine = new ethers.Contract(config.rewardEngineAddress, REWARD_ENGINE_ABI, signer);
  }

  async rewardPlayer(req: RewardRequest): Promise<string> {
    const amount = ethers.parseEther(req.amount);
    const rewardIdBytes = ethers.id(req.rewardId);

    const tx = await this.engine.rewardPlayer(
      req.player,
      amount,
      req.rewardType,
      rewardIdBytes
    );
    const receipt = await tx.wait(1);
    return receipt.hash;
  }

  async rewardBatch(
    rewards: Array<{ player: string; amount: string; reason: string }>
  ): Promise<string> {
    const entries = rewards.map((r) => ({
      player: r.player,
      amount: ethers.parseEther(r.amount),
      reason: r.reason,
    }));

    const tx = await this.engine.rewardBatch(entries);
    const receipt = await tx.wait(1);
    return receipt.hash;
  }

  generateRewardId(player: string, eventType: string, gameEventId: string): string {
    return ethers.id(`${player}:${eventType}:${gameEventId}:${Date.now()}`);
  }
}

// ── Client-side: player state ──────────────────────────────────────────────────

export class GameEconomyClient {
  private provider: ethers.BrowserProvider | null = null;
  private engine: ethers.Contract | null = null;
  private tokenContract: ethers.Contract | null = null;

  constructor(private readonly config: EconomyConfig & { tokenAddress: string }) {}

  async connect(): Promise<string> {
    if (!window.ethereum) throw new Error("No wallet detected. Install MetaMask or Rabby.");

    this.provider = new ethers.BrowserProvider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);

    const network = await this.provider.getNetwork();
    if (Number(network.chainId) !== this.config.chainId) {
      await this.switchToPharos();
    }

    const signer = await this.provider.getSigner();
    this.engine = new ethers.Contract(this.config.rewardEngineAddress, REWARD_ENGINE_ABI, signer);
    this.tokenContract = new ethers.Contract(this.config.tokenAddress, ERC20_ABI, this.provider);

    return signer.address;
  }

  private async switchToPharos(): Promise<void> {
    const chainIdHex = `0x${this.config.chainId.toString(16)}`;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (err: unknown) {
      // Chain not added yet — add it
      if ((err as { code?: number }).code === 4902) {
        const isTestnet = this.config.chainId === 688688;
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: isTestnet ? "Pharos Testnet" : "Pharos Mainnet",
              nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
              rpcUrls: [this.config.rpcUrl],
              blockExplorerUrls: [
                isTestnet ? "https://testnet.pharosscan.xyz" : "https://pharosscan.xyz",
              ],
            },
          ],
        });
      }
    }
  }

  async getPlayerState(playerAddress: string): Promise<PlayerEconomyState> {
    if (!this.engine || !this.tokenContract) {
      return {
        walletAddress: null,
        tokenBalance: 0n,
        pendingRewards: 0n,
        canClaimDaily: false,
        nextDailyClaimTime: null,
      };
    }

    const [tokenBalance, pendingRewards, [canClaimDaily, nextClaimTimestamp]] = await Promise.all([
      this.tokenContract.balanceOf(playerAddress),
      this.engine.getPendingRewards(playerAddress),
      this.engine.canClaimDaily(playerAddress),
    ]);

    return {
      walletAddress: playerAddress,
      tokenBalance,
      pendingRewards,
      canClaimDaily,
      nextDailyClaimTime:
        nextClaimTimestamp > 0n
          ? new Date(Number(nextClaimTimestamp) * 1000)
          : null,
    };
  }

  async claimDailyReward(): Promise<string> {
    if (!this.engine) throw new Error("Not connected");
    const tx = await this.engine.claimDailyReward();
    const receipt = await tx.wait(1);
    return receipt.hash;
  }

  async claimAllRewards(): Promise<string> {
    if (!this.engine) throw new Error("Not connected");
    const tx = await this.engine.claimReward();
    const receipt = await tx.wait(1);
    return receipt.hash;
  }

  formatTokens(amount: bigint): string {
    return parseFloat(ethers.formatEther(amount)).toLocaleString();
  }
}

declare global {
  interface Window {
    ethereum: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}
