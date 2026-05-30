import type { Chain } from "viem";

export const pharosTestnet = {
  id: 688689,
  name: "Pharos Atlantic Testnet",
  nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://atlantic.dplabs-internal.com"] },
    public:  { http: ["https://atlantic.dplabs-internal.com"] },
  },
  blockExplorers: {
    default: {
      name: "PharosScan Atlantic",
      url: "https://atlantic.pharosscan.xyz",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const pharosMainnet = {
  id: 1672,
  name: "Pharos Pacific Ocean Mainnet",
  nativeCurrency: { name: "Pharos", symbol: "PROS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.pharos.xyz"] },
    public:  { http: ["https://rpc.pharos.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "PharosScan",
      url: "https://www.pharosscan.xyz",
    },
  },
  testnet: false,
} as const satisfies Chain;

export const SUPPORTED_CHAINS = [pharosTestnet, pharosMainnet] as const;

export function getExplorerTxUrl(chainId: number, hash: string): string {
  if (chainId === pharosTestnet.id) {
    return `${pharosTestnet.blockExplorers.default.url}/tx/${hash}`;
  }
  if (chainId === pharosMainnet.id) {
    return `${pharosMainnet.blockExplorers.default.url}/tx/${hash}`;
  }
  return hash;
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  if (chainId === pharosTestnet.id) {
    return `${pharosTestnet.blockExplorers.default.url}/address/${address}`;
  }
  if (chainId === pharosMainnet.id) {
    return `${pharosMainnet.blockExplorers.default.url}/address/${address}`;
  }
  return address;
}

export function isPharosNetwork(chainId: number | undefined): boolean {
  return chainId === pharosTestnet.id || chainId === pharosMainnet.id;
}
