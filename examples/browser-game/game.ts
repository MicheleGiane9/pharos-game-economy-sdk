/**
 * Dragon Quest — Example Browser Game
 *
 * Demonstrates how to integrate the Pharos Game Economy SDK into a canvas game.
 * Server-side reward granting and player-side claiming are both shown.
 */

import { GameEconomyClient, GameRewardServer } from "./economy-integration";

// ── Game configuration ─────────────────────────────────────────────────────────

const ECONOMY_CONFIG = {
  rewardEngineAddress: process.env.REWARD_ENGINE_ADDRESS || "0x...",
  tokenAddress: process.env.GAME_REWARD_TOKEN_ADDRESS || "0x...",
  chainId: 688688,
  rpcUrl: "https://testnet.pharos.sh",
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  xpValue: number;
  killReward: string; // whole tokens
}

interface Quest {
  id: string;
  name: string;
  description: string;
  reward: string;
  completed: boolean;
}

interface GameState {
  playerAddress: string | null;
  playerName: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: bigint;
  pendingRewards: bigint;
  monsters: Monster[];
  quests: Quest[];
  log: string[];
}

// ── Game class ─────────────────────────────────────────────────────────────────

class DragonQuestGame {
  private state: GameState;
  private client: GameEconomyClient;
  private server: GameRewardServer | null = null; // Only in Node.js server context

  constructor() {
    this.client = new GameEconomyClient(ECONOMY_CONFIG);

    this.state = {
      playerAddress: null,
      playerName: "Hero",
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gold: 0n,
      pendingRewards: 0n,
      monsters: [
        {
          id: "slime-001",
          name: "Blue Slime",
          hp: 30,
          maxHp: 30,
          xpValue: 15,
          killReward: "5",
        },
        {
          id: "dragon-001",
          name: "Fire Dragon",
          hp: 500,
          maxHp: 500,
          xpValue: 250,
          killReward: "50",
        },
      ],
      quests: [
        {
          id: "quest-intro-001",
          name: "First Blood",
          description: "Defeat your first monster",
          reward: "25",
          completed: false,
        },
        {
          id: "quest-dragon-001",
          name: "Dragon Slayer",
          description: "Defeat the Fire Dragon",
          reward: "200",
          completed: false,
        },
      ],
      log: ["Welcome to Dragon Quest! Connect your wallet to earn on-chain rewards."],
    };
  }

  // ── Wallet connection ────────────────────────────────────────────────────────

  async connectWallet(): Promise<void> {
    try {
      const address = await this.client.connect();
      this.state.playerAddress = address;
      this.addLog(`Connected: ${address.slice(0, 8)}…`);

      const playerState = await this.client.getPlayerState(address);
      this.state.pendingRewards = playerState.pendingRewards;
      this.addLog(
        `Pending rewards: ${this.client.formatTokens(playerState.pendingRewards)} DGLD`
      );

      if (playerState.canClaimDaily) {
        this.addLog("Daily reward available! Click 'Claim Daily' to collect.");
      }

      this.renderUI();
    } catch (error) {
      this.addLog(`Connection failed: ${(error as Error).message}`);
    }
  }

  // ── Game actions ─────────────────────────────────────────────────────────────

  async attackMonster(monsterId: string): Promise<void> {
    const monster = this.state.monsters.find((m) => m.id === monsterId);
    if (!monster) return;

    const damage = Math.floor(Math.random() * 30) + 10;
    monster.hp = Math.max(0, monster.hp - damage);

    this.addLog(`You hit ${monster.name} for ${damage} damage! HP: ${monster.hp}/${monster.maxHp}`);

    if (monster.hp === 0) {
      await this.onMonsterKilled(monster);
    }

    this.renderUI();
  }

  private async onMonsterKilled(monster: Monster): Promise<void> {
    this.addLog(`${monster.name} defeated!`);

    // Grant XP
    this.state.xp += monster.xpValue;
    this.addLog(`+${monster.xpValue} XP`);

    // Check level up
    if (this.state.xp >= this.state.xpToNextLevel) {
      await this.onLevelUp();
    }

    // Grant on-chain reward via server
    if (this.state.playerAddress && this.server) {
      const rewardId = `kill-${monster.id}-${Date.now()}`;
      try {
        const txHash = await this.server.rewardPlayer({
          player: this.state.playerAddress,
          amount: monster.killReward,
          rewardType: "kill",
          rewardId,
        });
        this.addLog(`Reward granted! +${monster.killReward} DGLD (tx: ${txHash.slice(0, 10)}…)`);
      } catch {
        this.addLog("Reward granting failed — check server logs.");
      }
    } else if (this.state.playerAddress) {
      this.addLog(`(Dev mode) Would reward +${monster.killReward} DGLD for killing ${monster.name}`);
    }

    // Check quests
    await this.checkQuestCompletion(monster);

    // Reset monster
    monster.hp = monster.maxHp;
  }

  private async onLevelUp(): Promise<void> {
    this.state.level += 1;
    this.state.xp = 0;
    this.state.xpToNextLevel = Math.floor(this.state.xpToNextLevel * 1.5);

    this.addLog(`LEVEL UP! You are now level ${this.state.level}!`);

    if (this.state.playerAddress && this.server) {
      const levelUpReward = (this.state.level * 20).toString();
      const rewardId = `levelup-${this.state.level}-${this.state.playerAddress}-${Date.now()}`;
      try {
        await this.server.rewardPlayer({
          player: this.state.playerAddress,
          amount: levelUpReward,
          rewardType: "levelup",
          rewardId,
        });
        this.addLog(`+${levelUpReward} DGLD level-up bonus!`);
      } catch {
        this.addLog("Level-up reward failed — check server logs.");
      }
    }
  }

  private async checkQuestCompletion(monster: Monster): Promise<void> {
    for (const quest of this.state.quests) {
      if (quest.completed) continue;

      const shouldComplete =
        (quest.id === "quest-intro-001") ||
        (quest.id === "quest-dragon-001" && monster.id === "dragon-001");

      if (!shouldComplete) continue;

      quest.completed = true;
      this.addLog(`Quest complete: "${quest.name}"! +${quest.reward} DGLD`);

      if (this.state.playerAddress && this.server) {
        const rewardId = `quest-${quest.id}-${this.state.playerAddress}`;
        try {
          await this.server.rewardPlayer({
            player: this.state.playerAddress,
            amount: quest.reward,
            rewardType: "quest",
            rewardId,
          });
        } catch {
          this.addLog("Quest reward failed — check server logs.");
        }
      }
    }
  }

  // ── Player actions ───────────────────────────────────────────────────────────

  async claimDailyReward(): Promise<void> {
    if (!this.state.playerAddress) {
      this.addLog("Connect wallet first.");
      return;
    }
    try {
      const txHash = await this.client.claimDailyReward();
      this.addLog(`Daily reward claimed! (tx: ${txHash.slice(0, 10)}…)`);
      await this.refreshPlayerState();
    } catch (error) {
      this.addLog(`Claim failed: ${(error as Error).message}`);
    }
  }

  async claimAllRewards(): Promise<void> {
    if (!this.state.playerAddress) {
      this.addLog("Connect wallet first.");
      return;
    }
    if (this.state.pendingRewards === 0n) {
      this.addLog("No pending rewards to claim.");
      return;
    }
    try {
      const txHash = await this.client.claimAllRewards();
      this.addLog(`Rewards claimed! (tx: ${txHash.slice(0, 10)}…)`);
      this.state.pendingRewards = 0n;
      this.renderUI();
    } catch (error) {
      this.addLog(`Claim failed: ${(error as Error).message}`);
    }
  }

  private async refreshPlayerState(): Promise<void> {
    if (!this.state.playerAddress) return;
    const playerState = await this.client.getPlayerState(this.state.playerAddress);
    this.state.pendingRewards = playerState.pendingRewards;
    this.renderUI();
  }

  // ── UI helpers ───────────────────────────────────────────────────────────────

  private addLog(message: string): void {
    this.state.log.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
    if (this.state.log.length > 50) this.state.log.pop();
  }

  private renderUI(): void {
    const logEl = document.getElementById("game-log");
    if (logEl) {
      logEl.innerHTML = this.state.log.map((l) => `<p>${l}</p>`).join("");
    }

    const pendingEl = document.getElementById("pending-rewards");
    if (pendingEl) {
      pendingEl.textContent = this.client.formatTokens(this.state.pendingRewards) + " DGLD";
    }

    const levelEl = document.getElementById("player-level");
    if (levelEl) {
      levelEl.textContent = `Level ${this.state.level} (${this.state.xp}/${this.state.xpToNextLevel} XP)`;
    }
  }
}

export const game = new DragonQuestGame();
