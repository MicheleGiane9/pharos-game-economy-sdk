# Pharos Game Economy SDK

> Complete Web3 game economy for any game — deployed on Pharos Network in minutes.

A production-ready Skill for the [Pharos Agent Center](https://www.pharos.xyz/agent-center) that generates a full blockchain economy stack: ERC20 reward token, on-chain reward engine, claim system, wallet integration, and React dashboard.

---

## Features

| Feature | Details |
|---|---|
| **ERC20 Reward Token** | OpenZeppelin, capped supply, permit, access control, pause |
| **Reward Engine** | Per-player accounting, daily/quest/achievement/XP/kill rewards |
| **Claim System** | Pull-based claiming, anti-double-claim via rewardId, CEI pattern |
| **Wallet Integration** | MetaMask, Rabby, WalletConnect via Wagmi v2 + RainbowKit v2 |
| **React Dashboard** | Dashboard / Rewards / Claim pages, real-time events, responsive |
| **Deployment Scripts** | Hardhat, local + testnet + mainnet, auto-saves addresses |
| **Unity Integration** | C# bridge + example server-side API |
| **Browser Game Example** | Full canvas game with economy wired in |

---

## Requirements

- Node.js >= 18
- npm >= 9
- MetaMask (for dashboard testing)
- A Pharos Network wallet with PHRS (for testnet deploy)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/pharos-game-economy-sdk.git
cd pharos-game-economy-sdk
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
```
PRIVATE_KEY=your_wallet_private_key
```

> Never commit your real private key. The `.env` file is already in `.gitignore`.

### 4. Compile contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 31 Solidity files successfully (evm target: cancun).
```

### 5. Deploy locally (no real money needed)

Open **Terminal 1** — start local blockchain:
```bash
npx hardhat node
```

Open **Terminal 2** — deploy contracts:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Output:
```
✓ GameRewardToken deployed at: 0x5FbDB...
✓ RewardEngine deployed at:    0xe7f17...
✓ MINTER_ROLE granted
Saved to: deployments/localhost.json
```

### 6. Seed demo rewards (optional — for testing the claim)

```bash
npx hardhat run scripts/seed-demo.ts --network localhost
```

This credits 185 test tokens to a test wallet so you can see the full claim flow.

### 7. Launch the dashboard

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
VITE_GAME_REWARD_TOKEN_ADDRESS=<address from step 5>
VITE_REWARD_ENGINE_ADDRESS=<address from step 5>
VITE_CHAIN_ID=31337
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Start the dashboard:
```bash
npm run dev
```

Dashboard is live at `http://localhost:5173`.

---

## Deploy to Pharos Testnet

### 1. Get testnet PHRS

Get free PHRS from the Pharos faucet for gas fees.

### 2. Configure .env

```
PRIVATE_KEY=your_wallet_private_key
PHAROS_TESTNET_RPC=https://atlantic.dplabs-internal.com
```

### 3. Deploy

```bash
npx hardhat run scripts/deploy.ts --network pharosTestnet
```

### 4. Update frontend

Edit `frontend/.env.local`:
```
VITE_GAME_REWARD_TOKEN_ADDRESS=<deployed address>
VITE_REWARD_ENGINE_ADDRESS=<deployed address>
VITE_CHAIN_ID=688689
```

---

## Deploy to Pharos Mainnet

```bash
npx hardhat run scripts/deploy.ts --network pharosMainnet
```

> Make sure your wallet has PROS for gas fees.

---

## Project Structure

```
pharos-game-economy-sdk/
├── contracts/
│   ├── interfaces/
│   │   ├── IGameRewardToken.sol
│   │   └── IRewardEngine.sol
│   ├── GameRewardToken.sol       # ERC20 reward token
│   └── RewardEngine.sol          # Reward accounting engine
│
├── scripts/
│   ├── deploy.ts                 # Main deployment script
│   ├── seed-demo.ts              # Seed rewards for demo/testing
│   └── verify.ts                 # Block explorer verification
│
├── frontend/                     # React dashboard
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── Rewards.tsx
│       │   └── Claim.tsx
│       ├── components/
│       │   ├── RewardCard.tsx
│       │   ├── RewardHistory.tsx
│       │   ├── WalletPanel.tsx
│       │   └── ClaimButton.tsx
│       ├── hooks/
│       │   ├── useRewardEngine.ts
│       │   ├── useTokenBalance.ts
│       │   └── usePendingRewards.ts
│       └── lib/
│           ├── contracts.ts      # ABIs + addresses
│           └── pharos.ts         # Chain definitions
│
├── config/
│   └── game-economy.config.ts    # Economy parameters
│
├── examples/
│   ├── browser-game/             # Full canvas game example
│   └── unity/                    # Unity C# bridge
│
└── docs/
    ├── ARCHITECTURE.md
    ├── CONTRACTS.md
    ├── FRONTEND.md
    └── SECURITY.md
```

---

## Architecture

```
Game (Unity / Browser / Mobile)
        │
        ▼ game events
Game Server (Node.js)
        │ signs + submits
        ▼
Pharos Network
  ├── GameRewardToken.sol  (ERC20, minted on claim)
  └── RewardEngine.sol     (credits + distributes)
        │
        ▼ player claims
Player Wallet (MetaMask / Rabby / WalletConnect)
```

---

## Reward Types

| Type | Trigger | Default Amount |
|---|---|---|
| Daily Login | Server calls `rewardPlayer()` | Configurable |
| Quest | Server calls `rewardPlayer()` on quest complete | Configurable |
| Achievement | Server calls `rewardPlayer()` on achievement | Configurable |
| Monster Kill | Server calls `rewardBatch()` for kills | Custom per monster |
| Level Up | Server calls `rewardPlayer()` on level event | level × 20 tokens |
| XP | Server scales amount by XP gained | xp × rate |

All parameters are updatable on-chain by `REWARD_MANAGER_ROLE`.

---

## Game Server Integration

```typescript
import { ethers } from "ethers";
import RewardEngineABI from "./artifacts/contracts/RewardEngine.sol/RewardEngine.json";

const provider = new ethers.JsonRpcProvider("https://atlantic.dplabs-internal.com");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const engine = new ethers.Contract(process.env.REWARD_ENGINE_ADDRESS!, RewardEngineABI.abi, signer);

// Credit reward when player completes a quest
await engine.rewardPlayer(
  playerAddress,
  ethers.parseEther("50"),
  "quest",
  ethers.encodeBytes32String(`quest-${questId}-${playerId}`)
);

// Batch rewards (efficient for high-frequency events)
await engine.rewardBatch(
  [player1, player2],
  [ethers.parseEther("5"), ethers.parseEther("50")],
  ["kill", "kill"],
  [ethers.encodeBytes32String("kill-001"), ethers.encodeBytes32String("kill-002")]
);
```

---

## Pharos Network

| Network | Chain ID | RPC | Explorer | Token |
|---|---|---|---|---|
| Atlantic Testnet | 688689 | `https://atlantic.dplabs-internal.com` | `https://atlantic.pharosscan.xyz` | PHRS |
| Pacific Mainnet | 1672 | `https://rpc.pharos.xyz` | `https://www.pharosscan.xyz` | PROS |

---

## Security

- Reentrancy protected via `ReentrancyGuard` + CEI pattern
- Role-based access control (OpenZeppelin `AccessControl`)
- Anti-double-reward via `processedRewardIds` mapping
- Supply capped at `MAX_SUPPLY` (immutable)
- Emergency pause on token and engine
- **Private key never leaves your game server**

---

## FAQ

**Q: Do players need to configure MetaMask manually?**
No. RainbowKit handles network switching automatically on testnet and mainnet.

**Q: Can players see their rewards before claiming?**
Yes. `RewardEngine.getPendingRewards(address)` returns the full pending balance shown in real time on the dashboard.

**Q: What happens if the server sends the same reward twice?**
The second call reverts with `RewardAlreadyProcessed`. Always use a unique `rewardId` per game event.

**Q: How do I add a new reward type?**
No contract change needed. Call `rewardPlayer()` with any `rewardType` string and add a card to the Rewards page.

**Q: Can I change reward amounts after deployment?**
Yes. `REWARD_MANAGER_ROLE` can update all reward parameters on-chain at any time.

**Q: Is this audited?**
Not yet. Get an independent audit before deploying with real economic value on mainnet.

---

## License

MIT
