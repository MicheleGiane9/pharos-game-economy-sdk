# Smart Contracts — Pharos Game Economy SDK

## GameRewardToken

**File:** `contracts/GameRewardToken.sol`

ERC20 reward token with capped supply, access-controlled minting, permit support, and emergency pause.

### Constructor

```solidity
constructor(
    string memory name_,
    string memory symbol_,
    uint256 initialSupply,  // in wei (18 decimals)
    uint256 maxSupply,      // in wei, absolute cap
    address owner_          // receives DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE
)
```

### Key Functions

| Function | Role Required | Description |
|---|---|---|
| `mint(address to, uint256 amount)` | `MINTER_ROLE` | Mint tokens, capped at MAX_SUPPLY |
| `burn(uint256 amount)` | Token holder | Burn caller's tokens |
| `burnFrom(address, uint256)` | Approved spender | Burn on behalf |
| `pause()` | `PAUSER_ROLE` | Emergency pause all transfers |
| `unpause()` | `PAUSER_ROLE` | Resume transfers |
| `grantRole(bytes32, address)` | `DEFAULT_ADMIN_ROLE` | Grant a role |
| `revokeRole(bytes32, address)` | `DEFAULT_ADMIN_ROLE` | Revoke a role |

### Events

```solidity
event TokensMinted(address indexed to, uint256 amount);
// Standard ERC20: Transfer, Approval
```

### Custom Errors

```solidity
error ZeroAddress();
error ExceedsMaxSupply(uint256 requested, uint256 available);
```

---

## RewardEngine

**File:** `contracts/RewardEngine.sol`

Central reward accounting. Game servers credit rewards; players pull-claim by minting tokens.

### Constructor

```solidity
constructor(
    address rewardToken_,
    address admin_,
    uint256 dailyRewardAmount_,
    uint256 questRewardBase_,
    uint256 achievementRewardBase_,
    uint256 xpRewardRate_
)
```

### Key Functions

#### OPERATOR_ROLE (game servers)

```solidity
function rewardPlayer(
    address player,
    uint256 amount,
    string calldata rewardType,
    bytes32 rewardId          // unique per event — prevents double-credit
) external onlyRole(OPERATOR_ROLE) whenNotPaused;

function rewardBatch(
    BatchRewardEntry[] calldata entries
) external onlyRole(OPERATOR_ROLE) whenNotPaused;
// Max 100 entries per call.
```

#### Player-facing

```solidity
function claimDailyReward() external nonReentrant whenNotPaused;
// Adds dailyRewardAmount to pending. 24-hour cooldown per player.

function claimReward() external nonReentrant whenNotPaused;
// Mints all pending rewards to msg.sender. Clears pending first (CEI pattern).
```

#### Views

```solidity
function getPendingRewards(address player) external view returns (uint256);

function canClaimDaily(address player)
    external view returns (bool canClaim, uint256 nextClaimTime);

function getPlayerStats(address player)
    external view returns (
        uint256 pendingRewards,
        uint256 totalClaimed,
        uint256 lastDailyClaim,
        uint256 totalXP
    );
```

#### REWARD_MANAGER_ROLE (economy admin)

```solidity
function setDailyRewardAmount(uint256 amount) external;
function setQuestRewardBase(uint256 base) external;
function setAchievementRewardBase(uint256 base) external;
function setXPRewardRate(uint256 rate) external;
```

### Events

```solidity
event RewardGranted(
    address indexed player,
    uint256 amount,
    string rewardType,
    bytes32 indexed rewardId
);
event RewardClaimed(
    address indexed player,
    uint256 amount,
    uint256 timestamp
);
```

### Custom Errors

```solidity
error ZeroAddress();
error ZeroAmount();
error RewardAlreadyProcessed(bytes32 rewardId);
error DailyRewardNotAvailable(uint256 nextClaimTime);
error NoPendingRewards();
error BatchTooLarge(uint256 size, uint256 max);
error EmptyBatch();
```

---

## Deployment Addresses

After running deployment scripts, addresses are saved to `deployments/<network>.json`.

| Network | Chain ID |
|---|---|
| Pharos Testnet | 688688 |
| Pharos Mainnet | 747474 |
| Local (Hardhat) | 31337 |
