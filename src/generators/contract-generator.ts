import { copyFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const CONTRACT_SOURCES = [
  "contracts/interfaces/IGameRewardToken.sol",
  "contracts/interfaces/IRewardEngine.sol",
  "contracts/GameRewardToken.sol",
  "contracts/RewardEngine.sol",
];

export function copyContracts(sdkRoot: string, outputDir: string): void {
  for (const relPath of CONTRACT_SOURCES) {
    const src = join(sdkRoot, relPath);
    const dest = join(outputDir, relPath);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
}

export function generateHardhatConfig(outputDir: string): void {
  const { writeFileSync } = require("fs");

  const content = `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    pharosTestnet: {
      url: process.env.PHAROS_TESTNET_RPC || "https://testnet.pharos.sh",
      chainId: 688688,
      accounts: [PRIVATE_KEY],
    },
    pharosMainnet: {
      url: process.env.PHAROS_MAINNET_RPC || "https://pharos.sh",
      chainId: 747474,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      pharosTestnet: process.env.PHAROSSCAN_API_KEY || "placeholder",
      pharosMainnet: process.env.PHAROSSCAN_API_KEY || "placeholder",
    },
    customChains: [
      {
        network: "pharosTestnet",
        chainId: 688688,
        urls: {
          apiURL: "https://testnet.pharosscan.xyz/api",
          browserURL: "https://testnet.pharosscan.xyz",
        },
      },
      {
        network: "pharosMainnet",
        chainId: 747474,
        urls: {
          apiURL: "https://pharosscan.xyz/api",
          browserURL: "https://pharosscan.xyz",
        },
      },
    ],
  },
  paths: { sources: "./contracts", tests: "./test", cache: "./cache", artifacts: "./artifacts" },
};

export default config;
`;

  writeFileSync(join(outputDir, "hardhat.config.ts"), content);
}
