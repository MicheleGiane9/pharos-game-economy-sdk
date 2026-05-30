import { formatEther } from "viem";

interface RewardCardProps {
  title: string;
  amount: bigint;
  symbol: string;
  description?: string;
  badge?: string;
  badgeColor?: "green" | "blue" | "purple" | "amber";
  icon?: string;
}

const badgeColorMap: Record<string, string> = {
  green:  "bg-green-100 text-green-800 border-green-200",
  blue:   "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  amber:  "bg-amber-100 text-amber-800 border-amber-200",
};

export function RewardCard({
  title,
  amount,
  symbol,
  description,
  badge,
  badgeColor = "blue",
  icon = "🎮",
}: RewardCardProps) {
  const formatted = parseFloat(formatEther(amount)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {badge && (
        <span
          className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeColorMap[badgeColor]}`}
        >
          {badge}
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className="text-3xl select-none" aria-hidden>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 truncate">
            {formatted}{" "}
            <span className="text-base font-semibold text-pharos-500">{symbol}</span>
          </p>
          {description && (
            <p className="mt-1.5 text-sm text-slate-400">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
