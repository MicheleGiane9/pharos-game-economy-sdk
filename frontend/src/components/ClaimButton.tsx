import { useChainId } from "wagmi";
import { getExplorerTxUrl } from "../lib/pharos";
import { CONFIGURED_CHAIN_ID } from "../lib/contracts";
import type { TxState } from "../types";

interface ClaimButtonProps {
  onClick: () => void;
  txState: TxState;
  isLoading: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function ClaimButton({
  onClick,
  txState,
  isLoading,
  disabled = false,
  label = "Claim Rewards",
  className = "",
}: ClaimButtonProps) {
  const chainId = useChainId();
  const onCorrectNetwork = chainId === CONFIGURED_CHAIN_ID;

  const isDisabled = disabled || isLoading || !onCorrectNetwork || txState.status === "success";

  function getButtonText(): string {
    if (!onCorrectNetwork) return "Switch Network";
    if (txState.status === "pending") return "Confirm in wallet…";
    if (txState.status === "confirming") return "Confirming…";
    if (txState.status === "success") return "Claimed!";
    return label;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        className={`
          w-full px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200
          ${txState.status === "success"
            ? "bg-green-500 text-white cursor-default"
            : isDisabled
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-pharos-500 text-white hover:bg-pharos-600 active:scale-95 shadow-md hover:shadow-pharos-500/30"
          }
          ${className}
        `}
      >
        <span className="flex items-center justify-center gap-2">
          {isLoading && (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {txState.status === "success" && <span aria-hidden>✓</span>}
          {getButtonText()}
        </span>
      </button>

      {txState.status === "error" && txState.error && (
        <p className="text-xs text-red-500 text-center px-2">
          {txState.error.includes("NoPendingRewards")
            ? "No pending rewards to claim."
            : txState.error.includes("user rejected")
              ? "Transaction rejected."
              : "Transaction failed. Please try again."}
        </p>
      )}

      {txState.status === "success" && txState.hash && (
        <p className="text-xs text-center">
          <a
            href={getExplorerTxUrl(chainId, txState.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pharos-500 hover:underline"
          >
            View on PharosScan ↗
          </a>
        </p>
      )}
    </div>
  );
}
