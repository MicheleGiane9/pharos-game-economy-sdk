# Architecture — Pharos Game Economy SDK

## Overview

The SDK generates a three-layer architecture:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Game Layer (Unity / Browser / Mobile)                                │
│  Player events → Game Server API                                      │
└─────────────────────────┬────────────────────────────────────────────┘
                          │ HTTP (signed requests, OPERATOR key)
┌─────────────────────────▼────────────────────────────────────────────┐
│  Game Server (Node.js + GameRewardServer class)                       │
│  Validates events → Signs reward transactions → Submits to chain      │
└─────────────────────────┬────────────────────────────────────────────┘
                          │ Ethereum JSON-RPC
┌─────────────────────────▼────────────────────────────────────────────┐
│  Pharos Network (Blockchain)                                          │
│  GameRewardToken (ERC20) ← minted by RewardEngine                    │
│  RewardEngine ← credits pending rewards, processes claims             │
└────────────────────────────────────────────────────────────────────  ┘
```

## Reward Lifecycle

```
Game Event (kill, quest, levelup)
    │
    ▼
Game Server calls rewardPlayer(player, amount, type, rewardId)
    │
    ▼ on-chain
RewardEngine credits playerRewards[player].pendingRewards += amount
    │
    ▼ (later)
Player opens Dashboard → clicks "Claim"
    │
    ▼ on-chain
RewardEngine.claimReward():
  1. Reads pending balance
  2. Zeroes pending balance (reentrancy safe: effects before interactions)
  3. Calls GameRewardToken.mint(player, pending)
  4. Emits RewardClaimed event
```

## Contract Roles

| Role                 | Who holds it              | What they can do                            |
|----------------------|---------------------------|---------------------------------------------|
| `DEFAULT_ADMIN_ROLE` | Deployer multisig         | Grant/revoke roles, pause/unpause            |
| `MINTER_ROLE`        | RewardEngine contract     | Mint new tokens                              |
| `REWARD_MANAGER_ROLE`| Economy admin wallet      | Update reward parameters                     |
| `OPERATOR_ROLE`      | Game server wallets       | Call rewardPlayer() and rewardBatch()        |
| `PAUSER_ROLE`        | Deployer / admin          | Emergency pause token transfers              |

## Deployment Flow

```
npm run deploy:testnet
    │
    ├─ Deploy GameRewardToken(name, symbol, initialSupply, maxSupply, owner)
    ├─ Deploy RewardEngine(tokenAddress, admin, params...)
    ├─ GameRewardToken.grantRole(MINTER_ROLE, RewardEngine)
    └─ Save deployment JSON to ./deployments/pharosTestnet.json
```

## Frontend Architecture

```
main.tsx
└── WagmiProvider (chains: pharosTestnet, pharosMainnet)
    └── RainbowKitProvider
        └── QueryClientProvider
            └── App
                ├── /           → Dashboard.tsx
                ├── /rewards    → Rewards.tsx
                └── /claim      → Claim.tsx
```

Custom hooks separate contract logic from UI:
- `useTokenBalance` — reads ERC20 balance
- `usePendingRewards` — reads pending + daily claim state
- `useClaimReward` — writes claimReward() tx
- `useClaimDailyReward` — writes claimDailyReward() tx

## Anti-double-claim

The `processedRewardIds` mapping in `RewardEngine` stores a `bytes32` hash per granted reward. Operators must supply a globally unique `rewardId` per call. Suggested format:

```
keccak256(abi.encodePacked(chainId, gameEventType, playerId, eventTimestamp, nonce))
```

This guarantees idempotency even if the game server retries after a network failure.
