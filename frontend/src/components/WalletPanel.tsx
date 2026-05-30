import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { isPharosNetwork, getExplorerAddressUrl } from "../lib/pharos";

export function WalletPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const onPharos = isPharosNetwork(chainId);

  return (
    <div className="flex items-center gap-3">
      {isConnected && !onPharos && (
        <div className="text-xs font-medium bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full border border-amber-200">
          Switch to Pharos Network
        </div>
      )}

      {isConnected && address && (
        <a
          href={getExplorerAddressUrl(chainId, address)}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:block text-xs text-pharos-500 hover:text-pharos-700 hover:underline font-mono"
          title="View on PharosScan"
        >
          {address.slice(0, 6)}…{address.slice(-4)}
        </a>
      )}

      <ConnectButton
        chainStatus="icon"
        accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
        showBalance={false}
      />
    </div>
  );
}
