export const GAME_REWARD_TOKEN_ADDRESS =
  (import.meta.env.VITE_GAME_REWARD_TOKEN_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";

export const REWARD_ENGINE_ADDRESS =
  (import.meta.env.VITE_REWARD_ENGINE_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";

export const CONFIGURED_CHAIN_ID = parseInt(
  import.meta.env.VITE_CHAIN_ID || "688688",
  10
);

// ── ABIs ──────────────────────────────────────────────────────────────────────

export const GAME_REWARD_TOKEN_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "MAX_SUPPLY",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "paused",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "TokensMinted",
    type: "event",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const REWARD_ENGINE_ABI = [
  {
    name: "getPendingRewards",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "canClaimDaily",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "canClaim", type: "bool" },
      { name: "nextClaimTime", type: "uint256" },
    ],
  },
  {
    name: "getPlayerStats",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "pendingRewards", type: "uint256" },
      { name: "totalClaimed", type: "uint256" },
      { name: "lastDailyClaim", type: "uint256" },
      { name: "totalXP", type: "uint256" },
    ],
  },
  {
    name: "dailyRewardAmount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "questRewardBase",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "achievementRewardBase",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "claimDailyReward",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "claimReward",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "paused",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "RewardGranted",
    type: "event",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "rewardType", type: "string", indexed: false },
      { name: "rewardId", type: "bytes32", indexed: true },
    ],
  },
  {
    name: "RewardClaimed",
    type: "event",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
