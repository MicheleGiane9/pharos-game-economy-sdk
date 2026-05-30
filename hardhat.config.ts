import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const PHAROS_TESTNET_RPC = process.env.PHAROS_TESTNET_RPC || "https://atlantic.dplabs-internal.com";
const PHAROS_MAINNET_RPC = process.env.PHAROS_MAINNET_RPC || "https://rpc.pharos.xyz";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
      viaIR: false,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: false,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    pharosTestnet: {
      url: PHAROS_TESTNET_RPC,
      chainId: 688689,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      timeout: 60000,
    },
    pharosMainnet: {
      url: PHAROS_MAINNET_RPC,
      chainId: 1672,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      timeout: 60000,
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
        chainId: 688689,
        urls: {
          apiURL: "https://atlantic.pharosscan.xyz/api",
          browserURL: "https://atlantic.pharosscan.xyz",
        },
      },
      {
        network: "pharosMainnet",
        chainId: 1672,
        urls: {
          apiURL: "https://www.pharosscan.xyz/api",
          browserURL: "https://www.pharosscan.xyz",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 60000,
  },
};

export default config;
