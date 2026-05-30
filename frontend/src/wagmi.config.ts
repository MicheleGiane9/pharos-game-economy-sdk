import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { pharosTestnet, pharosMainnet } from "./lib/pharos";
import { CONFIGURED_CHAIN_ID } from "./lib/contracts";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID";

// Reorder chains so the configured one is first (RainbowKit shows it as default).
const chains =
  CONFIGURED_CHAIN_ID === pharosMainnet.id
    ? ([pharosMainnet, pharosTestnet] as const)
    : ([pharosTestnet, pharosMainnet] as const);

export const wagmiConfig = getDefaultConfig({
  appName: import.meta.env.VITE_APP_NAME || "Pharos Game Economy",
  projectId,
  chains,
  ssr: false,
});
