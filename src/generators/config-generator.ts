import { writeFileSync } from "fs";
import { join } from "path";

export interface EconomyParams {
  projectName: string;
  tokenName: string;
  symbol: string;
  initialSupply: number;
  maxSupply: number;
  dailyReward: number;
  questRewardBase: number;
  achievementReward: number;
  xpRewardRate: number;
  network: "local" | "testnet" | "mainnet";
  walletConnectProjectId: string;
}

export function generateConfig(params: EconomyParams, outputDir: string): void {
  const configContent = `import type { Chain } from "viem";

export interface GameEconomyConfig {
  tokenName: string;
  symbol: string;
  initialSupply: number;
  maxSupply: number;
  dailyReward: number;
  questRewardBase: number;
  achievementReward: number;
  xpRewardRate: number;
  network: "local" | "testnet" | "mainnet";
  appName: string;
  walletConnectProjectId: string;
}

const config: GameEconomyConfig = {
  tokenName: ${JSON.stringify(params.tokenName)},
  symbol: ${JSON.stringify(params.symbol)},
  initialSupply: ${params.initialSupply},
  maxSupply: ${params.maxSupply},
  dailyReward: ${params.dailyReward},
  questRewardBase: ${params.questRewardBase},
  achievementReward: ${params.achievementReward},
  xpRewardRate: ${params.xpRewardRate},
  network: ${JSON.stringify(params.network)},
  appName: ${JSON.stringify(params.projectName)},
  walletConnectProjectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || "",
};

export default config;

export const pharosTestnet = {
  id: 688688,
  name: "Pharos Testnet",
  nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet.pharos.sh"] } },
  blockExplorers: {
    default: { name: "PharosScan Testnet", url: "https://testnet.pharosscan.xyz" },
  },
  testnet: true,
} as const satisfies Chain;

export const pharosMainnet = {
  id: 747474,
  name: "Pharos Mainnet",
  nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
  rpcUrls: { default: { http: ["https://pharos.sh"] } },
  blockExplorers: {
    default: { name: "PharosScan", url: "https://pharosscan.xyz" },
  },
  testnet: false,
} as const satisfies Chain;
`;

  writeFileSync(join(outputDir, "config", "game-economy.config.ts"), configContent);
}

export function generateEnvExample(params: EconomyParams, outputDir: string): void {
  const envContent = `# Deployer private key — NEVER commit the real key
PRIVATE_KEY=0x...

# Pharos Network RPC endpoints
PHAROS_TESTNET_RPC=https://testnet.pharos.sh
PHAROS_MAINNET_RPC=https://pharos.sh

# Block explorer verification
PHAROSSCAN_API_KEY=your_api_key

# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Populated after deployment
VITE_GAME_REWARD_TOKEN_ADDRESS=
VITE_REWARD_ENGINE_ADDRESS=
VITE_CHAIN_ID=${params.network === "mainnet" ? 747474 : 688688}

# Token configuration
TOKEN_NAME=${JSON.stringify(params.tokenName)}
TOKEN_SYMBOL=${params.symbol}
INITIAL_SUPPLY=${params.initialSupply}
MAX_SUPPLY=${params.maxSupply}
DAILY_REWARD=${params.dailyReward}
QUEST_REWARD_BASE=${params.questRewardBase}
ACHIEVEMENT_REWARD_BASE=${params.achievementReward}
XP_REWARD_RATE=${params.xpRewardRate}
`;

  writeFileSync(join(outputDir, ".env.example"), envContent);
}
