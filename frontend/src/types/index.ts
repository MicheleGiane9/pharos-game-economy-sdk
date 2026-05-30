export interface PlayerStats {
  pendingRewards: bigint;
  totalClaimed: bigint;
  lastDailyClaim: bigint;
  totalXP: bigint;
}

export interface RewardEvent {
  player: string;
  amount: bigint;
  rewardType: string;
  rewardId: string;
  blockNumber: bigint;
  transactionHash: string;
  timestamp?: number;
}

export interface ClaimEvent {
  player: string;
  amount: bigint;
  timestamp: bigint;
  transactionHash: string;
  blockNumber: bigint;
}

export interface EconomyParams {
  dailyRewardAmount: bigint;
  questRewardBase: bigint;
  achievementRewardBase: bigint;
  xpRewardRate: bigint;
}

export interface ContractAddresses {
  gameRewardToken: `0x${string}`;
  rewardEngine: `0x${string}`;
}

export type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export interface TxState {
  status: TxStatus;
  hash?: `0x${string}`;
  error?: string;
}
