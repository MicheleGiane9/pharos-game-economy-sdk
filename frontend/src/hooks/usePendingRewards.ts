import { useReadContract } from "wagmi";
import { REWARD_ENGINE_ADDRESS, REWARD_ENGINE_ABI } from "../lib/contracts";
import type { PlayerStats } from "../types";

export function usePendingRewards(address: `0x${string}` | undefined) {
  const { data: pending, isLoading: pendingLoading, refetch: refetchPending } = useReadContract({
    address: REWARD_ENGINE_ADDRESS,
    abi: REWARD_ENGINE_ABI,
    functionName: "getPendingRewards",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8_000 },
  });

  const { data: dailyClaim, refetch: refetchDaily } = useReadContract({
    address: REWARD_ENGINE_ADDRESS,
    abi: REWARD_ENGINE_ABI,
    functionName: "canClaimDaily",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: stats, isLoading: statsLoading } = useReadContract({
    address: REWARD_ENGINE_ADDRESS,
    abi: REWARD_ENGINE_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { data: dailyAmount } = useReadContract({
    address: REWARD_ENGINE_ADDRESS,
    abi: REWARD_ENGINE_ABI,
    functionName: "dailyRewardAmount",
    query: { staleTime: 60_000 },
  });

  const playerStats: PlayerStats | undefined = stats
    ? {
        pendingRewards: stats[0],
        totalClaimed: stats[1],
        lastDailyClaim: stats[2],
        totalXP: stats[3],
      }
    : undefined;

  function refetch() {
    refetchPending();
    refetchDaily();
  }

  return {
    pendingRewards: pending ?? 0n,
    canClaimDaily: dailyClaim?.[0] ?? false,
    nextDailyClaimTime: dailyClaim?.[1] ?? 0n,
    dailyRewardAmount: dailyAmount ?? 0n,
    playerStats,
    isLoading: pendingLoading || statsLoading,
    refetch,
  };
}
