import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { formatEther } from "viem";
import { useCallback } from "react";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { usePendingRewards } from "../hooks/usePendingRewards";
import { useClaimReward, useClaimDailyReward } from "../hooks/useRewardEngine";
import { RewardCard } from "../components/RewardCard";
import { ClaimButton } from "../components/ClaimButton";
import { RewardHistory } from "../components/RewardHistory";
import { WalletPanel } from "../components/WalletPanel";

export function Claim() {
  const { address, isConnected } = useAccount();
  const { balance, symbol, refetch: refetchBalance } = useTokenBalance(address);
  const {
    pendingRewards,
    canClaimDaily,
    dailyRewardAmount,
    nextDailyClaimTime,
    refetch: refetchRewards,
  } = usePendingRewards(address);

  const handleClaimSuccess = useCallback(() => {
    setTimeout(() => {
      refetchBalance();
      refetchRewards();
    }, 2000);
  }, [refetchBalance, refetchRewards]);

  const {
    claim,
    txState: claimTxState,
    isLoading: isClaimLoading,
    reset: resetClaim,
  } = useClaimReward(handleClaimSuccess);

  const {
    claimDaily,
    txState: dailyTxState,
    isLoading: isDailyLoading,
    reset: resetDaily,
  } = useClaimDailyReward(handleClaimSuccess);

  const nextDailyDate =
    nextDailyClaimTime > 0n
      ? new Date(Number(nextDailyClaimTime) * 1000).toLocaleTimeString()
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-pharos-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pharos-500 flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="font-bold text-slate-800">Game Economy</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
            <Link to="/" className="hover:text-slate-800 transition-colors">Dashboard</Link>
            <Link to="/rewards" className="hover:text-slate-800 transition-colors">Rewards</Link>
            <Link to="/claim" className="text-pharos-600 font-semibold">Claim</Link>
          </nav>
          <WalletPanel />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Claim Rewards</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Mint your earned tokens directly to your wallet.
          </p>
        </div>

        {!isConnected ? (
          <div className="text-center py-24">
            <p className="text-slate-500 mb-6">Connect your wallet to claim rewards.</p>
            <WalletPanel />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: claim cards */}
            <div className="lg:col-span-2 space-y-4">
              {/* Balance */}
              <RewardCard
                title="Current Balance"
                amount={balance}
                symbol={symbol}
                description="Tokens in your wallet"
                icon="💰"
                badge="Live"
                badgeColor="green"
              />

              {/* Pending rewards claim */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start gap-3 mb-5">
                  <span className="text-3xl select-none" aria-hidden>⏳</span>
                  <div className="flex-1">
                    <h2 className="font-semibold text-slate-800">Pending Rewards</h2>
                    <p className="text-sm text-slate-400">Earned from quests, kills, achievements</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-pharos-600">
                      {parseFloat(formatEther(pendingRewards)).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">{symbol}</p>
                  </div>
                </div>

                <ClaimButton
                  onClick={pendingRewards === 0n ? () => {} : claim}
                  txState={claimTxState}
                  isLoading={isClaimLoading}
                  disabled={pendingRewards === 0n}
                  label={
                    pendingRewards === 0n
                      ? "No Pending Rewards"
                      : `Claim ${parseFloat(formatEther(pendingRewards)).toLocaleString()} ${symbol}`
                  }
                />

                {claimTxState.status === "success" && (
                  <button
                    type="button"
                    onClick={resetClaim}
                    className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Daily reward claim */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start gap-3 mb-5">
                  <span className="text-3xl select-none" aria-hidden>📅</span>
                  <div className="flex-1">
                    <h2 className="font-semibold text-slate-800">Daily Login Reward</h2>
                    <p className="text-sm text-slate-400">
                      {canClaimDaily
                        ? "Your daily reward is ready!"
                        : nextDailyDate
                          ? `Next claim available at ${nextDailyDate}`
                          : "Claim once every 24 hours"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-pharos-600">
                      {parseFloat(formatEther(dailyRewardAmount)).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">{symbol}</p>
                  </div>
                </div>

                <ClaimButton
                  onClick={claimDaily}
                  txState={dailyTxState}
                  isLoading={isDailyLoading}
                  disabled={!canClaimDaily}
                  label={canClaimDaily ? "Claim Daily Reward" : "Already Claimed Today"}
                />

                {dailyTxState.status === "success" && (
                  <button
                    type="button"
                    onClick={resetDaily}
                    className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Right column: history */}
            <div>
              <RewardHistory />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
