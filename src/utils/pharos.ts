import { ethers } from "ethers";

export const PHAROS_TESTNET_CHAIN_ID = 688688;
export const PHAROS_MAINNET_CHAIN_ID = 747474;
export const HARDHAT_CHAIN_ID = 31337;

export const PHAROS_TESTNET_RPC = "https://testnet.pharos.sh";
export const PHAROS_MAINNET_RPC = "https://pharos.sh";

export type NetworkName = "local" | "testnet" | "mainnet";

export interface PharosNetwork {
  name: NetworkName;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
}

export const PHAROS_NETWORKS: Record<NetworkName, PharosNetwork> = {
  local: {
    name: "local",
    chainId: HARDHAT_CHAIN_ID,
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  testnet: {
    name: "testnet",
    chainId: PHAROS_TESTNET_CHAIN_ID,
    rpcUrl: PHAROS_TESTNET_RPC,
    explorerUrl: "https://testnet.pharosscan.xyz",
    nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
  },
  mainnet: {
    name: "mainnet",
    chainId: PHAROS_MAINNET_CHAIN_ID,
    rpcUrl: PHAROS_MAINNET_RPC,
    explorerUrl: "https://pharosscan.xyz",
    nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
  },
};

export function getProvider(network: NetworkName): ethers.JsonRpcProvider {
  const { rpcUrl } = PHAROS_NETWORKS[network];
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getExplorerTxUrl(network: NetworkName, txHash: string): string {
  const { explorerUrl } = PHAROS_NETWORKS[network];
  return explorerUrl ? `${explorerUrl}/tx/${txHash}` : txHash;
}

export function getExplorerAddressUrl(network: NetworkName, address: string): string {
  const { explorerUrl } = PHAROS_NETWORKS[network];
  return explorerUrl ? `${explorerUrl}/address/${address}` : address;
}
