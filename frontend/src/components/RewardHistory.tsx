import { formatEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useWatchContractEvent } from "wagmi";
import { useState, useCallback } from "react";
import { REWARD_ENGINE_ADDRESS, REWARD_ENGINE_ABI } from "../lib/contracts";
import { getExplorerTxUrl } from "../lib/pharos";
import type { ClaimEvent } from "../types";

export function RewardHistory() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [events, setEvents] = useState<ClaimEvent[]>([]);

  const handleLog = useCallback(
    (log: {
      args?: { player?: string; amount?: bigint; timestamp?: bigint };
      transactionHash?: string;
      blockNumber?: bigint;
    }) => {
      if (!log.args || log.args.player?.toLowerCase() !== address?.toLowerCase()) return;

      setEvents((prev) => [
        {
          player: log.args!.player as string,
          amount: log.args!.amount ?? 0n,
          timestamp: log.args!.timestamp ?? 0n,
          transactionHash: (log.transactionHash ?? "") as string,
          blockNumber: log.blockNumber ?? 0n,
        },
        ...prev.slice(0, 49),
      ]);
    },
    [address]
  );

  useWatchContractEvent({
    address: REWARD_ENGINE_ADDRESS,
    abi: REWARD_ENGINE_ABI,
    eventName: "RewardClaimed",
    onLogs: (logs) => logs.forEach(handleLog),
    enabled: !!address,
  });

  if (!address) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
        Connect your wallet to see reward history.
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-1">Claim History</h3>
        <p className="text-sm text-slate-400">Your claim history will appear here in real time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-700">Claim History</h3>
        <p className="text-xs text-slate-400 mt-0.5">Session claims — {events.length} events</p>
      </div>

      <ul className="divide-y divide-slate-100">
        {events.map((ev, idx) => (
          <li key={`${ev.transactionHash}-${idx}`} className="flex items-center justify-between px-6 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">
                +{parseFloat(formatEther(ev.amount)).toLocaleString()} tokens
              </p>
              <p className="text-xs text-slate-400">
                {ev.timestamp > 0n
                  ? new Date(Number(ev.timestamp) * 1000).toLocaleString()
                  : "Just now"}
              </p>
            </div>
            {ev.transactionHash && (
              <a
                href={getExplorerTxUrl(chainId, ev.transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pharos-500 hover:underline font-mono"
                title={ev.transactionHash}
              >
                {ev.transactionHash.slice(0, 8)}…
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
