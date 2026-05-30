import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import { WalletPanel } from "../components/WalletPanel";
import { REWARD_ENGINE_ADDRESS, REWARD_ENGINE_ABI } from "../lib/contracts";

interface RewardTypeCardProps {
  emoji: string;
  title: string;
  description: string;
  amount: bigint | undefined;
  symbol: string;
  trigger: string;
}

function RewardTypeCard({
  emoji,
  title,
  description,
  amount,
  symbol,
  trigger,
}: RewardTypeCardProps) {
  const formatted = amount
    ? parseFloat(formatEther(amount)).toLocaleString()
    : "—";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl select-none" aria-hidden>{emoji}</span>
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 mb-3">
        <p className="text-xs text-slate-500 mb-1">Reward Amount</p>
        <p className="text-lg font-bold text-pharos-600">
          {formatted} <span className="text-sm font-semibold">{symbol}</span>
        </p>
      </div>
      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-600">Trigger: </span>
        {trigger}
      </p>
    </div>
  );
}

export function Rewards() {
  const { isConnected } = useAccount();

  const { data: dailyAmount } = useReadContract({
    address: REWARD_ENGINE_ADDRESS,
    abi: REWARD_ENGINE_ABI,
    functionName: "dailyRewardAmount",
    query: { staleTime: 60_000 },
  });

  const { data: questBase } = useReadContract({
    address: REWARD_ENGINE_ADDRESS,
    abi: REWARD_ENGINE_ABI,
    functionName: "questRewardBase",
    query: { staleTime: 60_000 },
  });

  const { data: achievementBase } = useReadContract({
    address: REWARD_ENGINE_ADDRESS,
    abi: REWARD_ENGINE_ABI,
    functionName: "achievementRewardBase",
    query: { staleTime: 60_000 },
  });

  const symbol = import.meta.env.VITE_TOKEN_SYMBOL || "GRT";

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
            <Link to="/rewards" className="text-pharos-600 font-semibold">Rewards</Link>
            <Link to="/claim" className="hover:text-slate-800 transition-colors">Claim</Link>
          </nav>
          <WalletPanel />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Reward Types</h1>
          <p className="text-slate-500 mt-1 text-sm">
            All reward amounts are stored on-chain in the RewardEngine contract.
          </p>
        </div>

        {!isConnected && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            Connect your wallet to see live reward amounts from the chain.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          <RewardTypeCard
            emoji="📅"
            title="Daily Login"
            description="Login reward — once per 24 hours"
            amount={dailyAmount}
            symbol={symbol}
            trigger="Player calls claimDailyReward()"
          />
          <RewardTypeCard
            emoji="⚔️"
            title="Quest Completion"
            description="Base reward for finishing quests"
            amount={questBase}
            symbol={symbol}
            trigger="Server calls rewardPlayer() on quest complete"
          />
          <RewardTypeCard
            emoji="🏆"
            title="Achievement Unlock"
            description="Reward for major achievements"
            amount={achievementBase}
            symbol={symbol}
            trigger="Server calls rewardPlayer() on achievement"
          />
          <RewardTypeCard
            emoji="🧠"
            title="XP Rewards"
            description="Tokens earned per XP point"
            amount={undefined}
            symbol={symbol}
            trigger="Server calls rewardPlayer() with XP-scaled amount"
          />
          <RewardTypeCard
            emoji="💀"
            title="Monster Kill"
            description="Custom kill reward from your game server"
            amount={undefined}
            symbol={symbol}
            trigger="Server calls rewardBatch() for kills"
          />
          <RewardTypeCard
            emoji="⬆️"
            title="Level Up"
            description="Bonus reward on level progression"
            amount={undefined}
            symbol={symbol}
            trigger="Server calls rewardPlayer() on level event"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-3">How It Works</h2>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pharos-100 text-pharos-700 flex items-center justify-center text-xs font-bold">1</span>
              <span>Your <strong>game server</strong> detects game events (kill, quest, level-up).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pharos-100 text-pharos-700 flex items-center justify-center text-xs font-bold">2</span>
              <span>Server calls <code className="bg-slate-100 px-1 rounded font-mono text-xs">RewardEngine.rewardPlayer()</code> with the player address and amount.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pharos-100 text-pharos-700 flex items-center justify-center text-xs font-bold">3</span>
              <span>Pending rewards accumulate on-chain until the player claims them.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pharos-100 text-pharos-700 flex items-center justify-center text-xs font-bold">4</span>
              <span>Player clicks <strong>Claim</strong> — tokens are minted directly to their wallet.</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
