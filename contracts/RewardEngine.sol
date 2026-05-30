// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IGameRewardToken.sol";

/**
 * @title RewardEngine
 * @notice Central reward accounting contract for Pharos game economies.
 *
 * Reward lifecycle:
 *   1. Off-chain game server calls rewardPlayer() / rewardBatch() to credit a player.
 *   2. Player calls claimReward() to mint their accrued tokens into their wallet.
 *   3. Daily reward is self-service via claimDailyReward().
 *
 * Security model:
 *   - OPERATOR_ROLE  : game servers, backend signers — may grant rewards.
 *   - REWARD_MANAGER_ROLE : economy admins — may update reward parameters.
 *   - DEFAULT_ADMIN_ROLE  : multisig owner — may pause/unpause and manage roles.
 *   - Reentrancy guard on all state-mutating external calls.
 *   - Unique rewardId per grant prevents double-crediting.
 *   - Claim mints tokens on demand; no pre-funding required.
 */
contract RewardEngine is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IGameRewardToken public immutable rewardToken;

    uint256 public dailyRewardAmount;
    uint256 public questRewardBase;
    uint256 public achievementRewardBase;
    uint256 public xpRewardRate;

    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant DAILY_COOLDOWN = 1 days;

    struct PlayerRewards {
        uint256 pendingRewards;
        uint256 totalClaimed;
        uint256 lastDailyClaim;
        uint256 totalXP;
    }

    struct BatchRewardEntry {
        address player;
        uint256 amount;
        string reason;
    }

    mapping(address => PlayerRewards) public playerRewards;
    mapping(bytes32 => bool) public processedRewardIds;

    event RewardGranted(
        address indexed player,
        uint256 amount,
        string rewardType,
        bytes32 indexed rewardId
    );
    event RewardClaimed(address indexed player, uint256 amount, uint256 timestamp);
    event DailyRewardAmountUpdated(uint256 newAmount);
    event QuestRewardBaseUpdated(uint256 newBase);
    event AchievementRewardBaseUpdated(uint256 newBase);
    event XPRewardRateUpdated(uint256 newRate);

    error ZeroAddress();
    error ZeroAmount();
    error RewardAlreadyProcessed(bytes32 rewardId);
    error DailyRewardNotAvailable(uint256 nextClaimTime);
    error NoPendingRewards();
    error BatchTooLarge(uint256 size, uint256 max);
    error EmptyBatch();

    constructor(
        address rewardToken_,
        address admin_,
        uint256 dailyRewardAmount_,
        uint256 questRewardBase_,
        uint256 achievementRewardBase_,
        uint256 xpRewardRate_
    ) {
        if (rewardToken_ == address(0)) revert ZeroAddress();
        if (admin_ == address(0)) revert ZeroAddress();

        rewardToken = IGameRewardToken(rewardToken_);
        dailyRewardAmount = dailyRewardAmount_;
        questRewardBase = questRewardBase_;
        achievementRewardBase = achievementRewardBase_;
        xpRewardRate = xpRewardRate_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(REWARD_MANAGER_ROLE, admin_);
        _grantRole(OPERATOR_ROLE, admin_);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Reward granting — called by game servers / operators
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Credit a single player with a named reward. Idempotent via rewardId.
     * @param player     Player wallet address.
     * @param amount     Token amount in wei.
     * @param rewardType Human-readable type ("quest", "achievement", "kill", …).
     * @param rewardId   Globally unique identifier — prevents double-crediting.
     */
    function rewardPlayer(
        address player,
        uint256 amount,
        string calldata rewardType,
        bytes32 rewardId
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        if (player == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (processedRewardIds[rewardId]) revert RewardAlreadyProcessed(rewardId);

        processedRewardIds[rewardId] = true;
        playerRewards[player].pendingRewards += amount;

        emit RewardGranted(player, amount, rewardType, rewardId);
    }

    /**
     * @notice Credit multiple players in a single transaction (gas optimised).
     * @dev    rewardId for each entry is derived on-chain to avoid replay.
     *         Entries with a zero address or zero amount revert the whole batch.
     */
    function rewardBatch(
        BatchRewardEntry[] calldata entries
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        if (entries.length == 0) revert EmptyBatch();
        if (entries.length > MAX_BATCH_SIZE) revert BatchTooLarge(entries.length, MAX_BATCH_SIZE);

        for (uint256 i = 0; i < entries.length; ) {
            BatchRewardEntry calldata entry = entries[i];

            if (entry.player == address(0)) revert ZeroAddress();
            if (entry.amount == 0) revert ZeroAmount();

            bytes32 rewardId = keccak256(
                abi.encodePacked(block.chainid, block.number, entry.player, entry.amount, entry.reason, i)
            );

            // Skip if this derived id was somehow already processed (edge case).
            if (!processedRewardIds[rewardId]) {
                processedRewardIds[rewardId] = true;
                playerRewards[entry.player].pendingRewards += entry.amount;
                emit RewardGranted(entry.player, entry.amount, entry.reason, rewardId);
            }

            unchecked {
                ++i;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Player-facing actions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Claim the daily login reward. One per player per 24 hours.
     */
    function claimDailyReward() external nonReentrant whenNotPaused {
        PlayerRewards storage rewards = playerRewards[msg.sender];
        uint256 nextClaimTime = rewards.lastDailyClaim + DAILY_COOLDOWN;

        if (block.timestamp < nextClaimTime) {
            revert DailyRewardNotAvailable(nextClaimTime);
        }

        rewards.lastDailyClaim = block.timestamp;
        rewards.pendingRewards += dailyRewardAmount;

        bytes32 rewardId = keccak256(
            abi.encodePacked("daily", msg.sender, block.timestamp)
        );
        emit RewardGranted(msg.sender, dailyRewardAmount, "daily", rewardId);
    }

    /**
     * @notice Mint all pending rewards to the caller's wallet.
     *         Clears pending balance before minting (checks-effects-interactions).
     */
    function claimReward() external nonReentrant whenNotPaused {
        PlayerRewards storage rewards = playerRewards[msg.sender];
        uint256 pending = rewards.pendingRewards;

        if (pending == 0) revert NoPendingRewards();

        rewards.pendingRewards = 0;
        rewards.totalClaimed += pending;

        rewardToken.mint(msg.sender, pending);

        emit RewardClaimed(msg.sender, pending, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────────────────

    function getPendingRewards(address player) external view returns (uint256) {
        return playerRewards[player].pendingRewards;
    }

    function canClaimDaily(
        address player
    ) external view returns (bool canClaim, uint256 nextClaimTime) {
        nextClaimTime = playerRewards[player].lastDailyClaim + DAILY_COOLDOWN;
        canClaim = block.timestamp >= nextClaimTime;
    }

    function getPlayerStats(
        address player
    )
        external
        view
        returns (
            uint256 pendingRewards,
            uint256 totalClaimed,
            uint256 lastDailyClaim,
            uint256 totalXP
        )
    {
        PlayerRewards storage r = playerRewards[player];
        return (r.pendingRewards, r.totalClaimed, r.lastDailyClaim, r.totalXP);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin parameter updates
    // ─────────────────────────────────────────────────────────────────────────

    function setDailyRewardAmount(uint256 amount) external onlyRole(REWARD_MANAGER_ROLE) {
        dailyRewardAmount = amount;
        emit DailyRewardAmountUpdated(amount);
    }

    function setQuestRewardBase(uint256 base) external onlyRole(REWARD_MANAGER_ROLE) {
        questRewardBase = base;
        emit QuestRewardBaseUpdated(base);
    }

    function setAchievementRewardBase(uint256 base) external onlyRole(REWARD_MANAGER_ROLE) {
        achievementRewardBase = base;
        emit AchievementRewardBaseUpdated(base);
    }

    function setXPRewardRate(uint256 rate) external onlyRole(REWARD_MANAGER_ROLE) {
        xpRewardRate = rate;
        emit XPRewardRateUpdated(rate);
    }

    function grantOperatorRole(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(OPERATOR_ROLE, operator);
    }

    function revokeOperatorRole(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(OPERATOR_ROLE, operator);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
