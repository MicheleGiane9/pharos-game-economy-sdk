import { useReadContract } from "wagmi";
import { GAME_REWARD_TOKEN_ADDRESS, GAME_REWARD_TOKEN_ABI } from "../lib/contracts";

export function useTokenBalance(address: `0x${string}` | undefined) {
  const { data: balance, isLoading, refetch } = useReadContract({
    address: GAME_REWARD_TOKEN_ADDRESS,
    abi: GAME_REWARD_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { data: symbol } = useReadContract({
    address: GAME_REWARD_TOKEN_ADDRESS,
    abi: GAME_REWARD_TOKEN_ABI,
    functionName: "symbol",
    query: { staleTime: Infinity },
  });

  const { data: tokenName } = useReadContract({
    address: GAME_REWARD_TOKEN_ADDRESS,
    abi: GAME_REWARD_TOKEN_ABI,
    functionName: "name",
    query: { staleTime: Infinity },
  });

  return {
    balance: balance ?? 0n,
    symbol: symbol ?? "???",
    tokenName: tokenName ?? "",
    isLoading,
    refetch,
  };
}
