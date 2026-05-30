# Frontend — Pharos Game Economy SDK

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI | React | 18.x |
| Routing | React Router | 6.x |
| Styling | Tailwind CSS | 3.x |
| Build | Vite | 5.x |
| Chain interaction | Viem | 2.x |
| Wallet hooks | Wagmi | 2.x |
| Wallet UI | RainbowKit | 2.x |
| Data fetching | TanStack Query | 5.x |

## Pages

### `/` — Dashboard
- Token balance card
- Pending rewards card
- Total claimed card
- Daily reward status
- Quick action links to Claim and Rewards pages

### `/rewards` — Reward Types
- Live on-chain reward parameters (pulled from `RewardEngine`)
- Reward type cards: Daily, Quest, Achievement, XP, Kill, Level Up
- How-it-works explainer

### `/claim` — Claim
- Pending rewards + claim button
- Daily reward + claim button
- Real-time claim history (via `useWatchContractEvent`)

## Custom Hooks

### `useTokenBalance(address)`
Reads `balanceOf`, `symbol`, and `name` from `GameRewardToken`. Refreshes every 10 seconds.

### `usePendingRewards(address)`
Reads `getPendingRewards`, `canClaimDaily`, `getPlayerStats`, and `dailyRewardAmount` from `RewardEngine`. Refreshes every 8–15 seconds.

### `useClaimReward(onSuccess?)`
Wraps `useWriteContract` + `useWaitForTransactionReceipt` for `claimReward()`. Returns `{ claim, txState, isLoading, reset }`.

### `useClaimDailyReward(onSuccess?)`
Same pattern for `claimDailyReward()`.

## Environment Variables

Create `frontend/.env.local`:

```env
VITE_GAME_REWARD_TOKEN_ADDRESS=0x...
VITE_REWARD_ENGINE_ADDRESS=0x...
VITE_CHAIN_ID=688688
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_APP_NAME=Dragon Quest Economy
VITE_TOKEN_SYMBOL=DGLD
```

## Adding Pharos Network to MetaMask

If a user's wallet doesn't have Pharos configured, `WalletPanel` prompts to switch. RainbowKit handles the `wallet_addEthereumChain` call automatically for supported wallets.

Manual network details:
- **Name**: Pharos Testnet
- **RPC**: `https://testnet.pharos.sh`
- **Chain ID**: 688688
- **Symbol**: PHRS
- **Explorer**: `https://testnet.pharosscan.xyz`

## Development

```bash
cd frontend
npm install
cp ../.env.example .env.local    # add contract addresses
npm run dev                       # starts on http://localhost:5173
```

## Build

```bash
npm run build    # outputs to frontend/dist/
```

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, IPFS).
