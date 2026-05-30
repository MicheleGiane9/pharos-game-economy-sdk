import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { formatEther } from "viem";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { usePendingRewards } from "../hooks/usePendingRewards";
import { RewardCard } from "../components/RewardCard";
import { WalletPanel } from "../components/WalletPanel";

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const { balance, symbol, tokenName } = useTokenBalance(address);
  const { pendingRewards, dailyRewardAmount, playerStats, canClaimDaily } =
    usePendingRewards(address);

  const totalClaimed = playerStats?.totalClaimed ?? 0n;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-pharos-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pharos-500 flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="font-bold text-slate-800">
              {tokenName || "Game Economy"}
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
            <Link to="/" className="text-pharos-600 font-semibold">Dashboard</Link>
            <Link to="/rewards" className="hover:text-slate-800 transition-colors">Rewards</Link>
            <Link to="/claim" className="hover:text-slate-800 transition-colors">Claim</Link>
          </nav>
          <WalletPanel />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {!isConnected ? (
          <NotConnectedView />
        ) : (
          <ConnectedView
            balance={balance}
            symbol={symbol}
            pendingRewards={pendingRewards}
            totalClaimed={totalClaimed}
            dailyRewardAmount={dailyRewardAmount}
            canClaimDaily={canClaimDaily}
          />
        )}
      </main>
    </div>
  );
}

function NotConnectedView() {
  return (
    <div className="text-center py-24">
      <div className="text-5xl mb-4 select-none" aria-hidden>🎮</div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Game Economy Dashboard</h1>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        Connect your wallet to view your token balance, pending rewards, and claim history
        on Pharos Network.
      </p>
      <div className="flex justify-center">
        <WalletPanel />
      </div>
    </div>
  );
}

interface ConnectedViewProps {
  balance: bigint;
  symbol: string;
  pendingRewards: bigint;
  totalClaimed: bigint;
  dailyRewardAmount: bigint;
  canClaimDaily: boolean;
}

function ConnectedView({
  balance,
  symbol,
  pendingRewards,
  totalClaimed,
  dailyRewardAmount,
  canClaimDaily,
}: ConnectedViewProps) {
  const hasClaimable = pendingRewards > 0n;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Your Economy Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Powered by Pharos Network · All rewards are on-chain
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RewardCard
          title="Token Balance"
          amount={balance}
          symbol={symbol}
          description="Your wallet balance"
          icon="💰"
          badge="Live"
          badgeColor="green"
        />
        <RewardCard
          title="Pending Rewards"
          amount={pendingRewards}
          symbol={symbol}
          description={hasClaimable ? "Ready to claim" : "Keep playing to earn"}
          icon="⏳"
          badge={hasClaimable ? "Claimable" : undefined}
          badgeColor="blue"
        />
        <RewardCard
          title="Total Claimed"
          amount={totalClaimed}
          symbol={symbol}
          description="All-time claimed rewards"
          icon="🏆"
        />
        <RewardCard
          title="Daily Reward"
          amount={dailyRewardAmount}
          symbol={symbol}
          description={canClaimDaily ? "Available now!" : "Check back tomorrow"}
          icon="📅"
          badge={canClaimDaily ? "Available" : "Claimed"}
          badgeColor={canClaimDaily ? "green" : "amber"}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/claim"
          className={`
            flex items-center justify-between px-6 py-5 rounded-2xl border transition-all
            ${hasClaimable
              ? "bg-pharos-500 border-pharos-500 text-white hover:bg-pharos-600 shadow-md hover:shadow-pharos-500/30"
              : "bg-white border-slate-200 text-slate-400"
            }
          `}
        >
          <div>
            <p className="font-semibold">
              {hasClaimable ? "Claim Pending Rewards" : "No Pending Rewards"}
            </p>
            <p className="text-sm opacity-80 mt-0.5">
              {hasClaimable
                ? `${parseFloat(formatEther(pendingRewards)).toLocaleString()} ${symbol} awaiting`
                : "Play to earn more"}
            </p>
          </div>
          <span className="text-2xl select-none" aria-hidden>→</span>
        </Link>

        <Link
          to="/rewards"
          className="flex items-center justify-between px-6 py-5 rounded-2xl border bg-white border-slate-200 text-slate-700 hover:border-pharos-300 hover:bg-pharos-50 transition-all"
        >
          <div>
            <p className="font-semibold">View Reward Types</p>
            <p className="text-sm text-slate-400 mt-0.5">Quest, achievement, XP rewards</p>
          </div>
          <span className="text-2xl select-none" aria-hidden>🎯</span>
        </Link>
      </div>
    </div>
  );
}
