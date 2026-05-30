import type { Chain } from "viem";

export interface GameEconomyConfig {
  // Token settings
  tokenName: string;
  symbol: string;
  initialSupply: number;
  maxSupply: number;

  // Reward parameters (in whole tokens)
  dailyReward: number;
  questRewardBase: number;
  achievementReward: number;
  xpRewardRate: number;

  // Network
  network: "local" | "testnet" | "mainnet";

  // Frontend
  appName: string;
  walletConnectProjectId: string;
}

const config: GameEconomyConfig = {
  // ── Token ─────────────────────────────────────────────────────────────────
  tokenName: "Dragon Gold",
  symbol: "DGLD",
  initialSupply: 1_000_000,     // tokens pre-minted to deployer
  maxSupply: 1_000_000_000,     // absolute cap

  // ── Reward economy ────────────────────────────────────────────────────────
  dailyReward: 10,              // tokens per daily login
  questRewardBase: 50,          // base tokens for quest completion
  achievementReward: 100,       // tokens for achievements
  xpRewardRate: 0.01,           // tokens minted per XP point

  // ── Network ───────────────────────────────────────────────────────────────
  network: "testnet",

  // ── Frontend ──────────────────────────────────────────────────────────────
  appName: "Dragon Gold — Game Economy",
  walletConnectProjectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || "",
};

export default config;

// ── Pharos Network chain definitions ──────────────────────────────────────────

export const pharosTestnet = {
  id: 688688,
  name: "Pharos Testnet",
  nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.pharos.sh"] },
  },
  blockExplorers: {
    default: {
      name: "PharosScan Testnet",
      url: "https://testnet.pharosscan.xyz",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const pharosMainnet = {
  id: 747474,
  name: "Pharos Mainnet",
  nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://pharos.sh"] },
  },
  blockExplorers: {
    default: {
      name: "PharosScan",
      url: "https://pharosscan.xyz",
    },
  },
  testnet: false,
} as const satisfies Chain;
