import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect } from "react";
import { REWARD_ENGINE_ADDRESS, REWARD_ENGINE_ABI } from "../lib/contracts";
import type { TxState } from "../types";

export function useClaimReward(onSuccess?: () => void) {
  const [txState, setTxState] = useState<TxState>({ status: "idle" });

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isPending) {
      setTxState({ status: "pending" });
    } else if (hash && isConfirming) {
      setTxState({ status: "confirming", hash });
    } else if (isSuccess) {
      setTxState({ status: "success", hash });
      onSuccess?.();
    } else if (writeError) {
      setTxState({ status: "error", error: writeError.message });
    }
  }, [isPending, hash, isConfirming, isSuccess, writeError, onSuccess]);

  function claim() {
    setTxState({ status: "idle" });
    writeContract({
      address: REWARD_ENGINE_ADDRESS,
      abi: REWARD_ENGINE_ABI,
      functionName: "claimReward",
    });
  }

  function reset() {
    setTxState({ status: "idle" });
  }

  return { claim, txState, isLoading: isPending || isConfirming, reset };
}

export function useClaimDailyReward(onSuccess?: () => void) {
  const [txState, setTxState] = useState<TxState>({ status: "idle" });

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isPending) {
      setTxState({ status: "pending" });
    } else if (hash && isConfirming) {
      setTxState({ status: "confirming", hash });
    } else if (isSuccess) {
      setTxState({ status: "success", hash });
      onSuccess?.();
    } else if (writeError) {
      setTxState({ status: "error", error: writeError.message });
    }
  }, [isPending, hash, isConfirming, isSuccess, writeError, onSuccess]);

  function claimDaily() {
    setTxState({ status: "idle" });
    writeContract({
      address: REWARD_ENGINE_ADDRESS,
      abi: REWARD_ENGINE_ABI,
      functionName: "claimDailyReward",
    });
  }

  function reset() {
    setTxState({ status: "idle" });
  }

  return { claimDaily, txState, isLoading: isPending || isConfirming, reset };
}
