// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRewardEngine {
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
    event DailyRewardAmountUpdated(uint256 newAmount);
    event QuestRewardBaseUpdated(uint256 newBase);
    event AchievementRewardBaseUpdated(uint256 newBase);
    event XPRewardRateUpdated(uint256 newRate);

    function rewardPlayer(
        address player,
        uint256 amount,
        string calldata rewardType,
        bytes32 rewardId
    ) external;

    function rewardBatch(BatchRewardEntry[] calldata entries) external;

    function claimDailyReward() external;

    function claimReward() external;

    function getPendingRewards(address player) external view returns (uint256);

    function canClaimDaily(address player)
        external
        view
        returns (bool canClaim, uint256 nextClaimTime);

    function playerRewards(address player)
        external
        view
        returns (
            uint256 pendingRewards,
            uint256 totalClaimed,
            uint256 lastDailyClaim,
            uint256 totalXP
        );

    function dailyRewardAmount() external view returns (uint256);
    function questRewardBase() external view returns (uint256);
    function achievementRewardBase() external view returns (uint256);
    function xpRewardRate() external view returns (uint256);

    function setDailyRewardAmount(uint256 amount) external;
    function setQuestRewardBase(uint256 base) external;
    function setAchievementRewardBase(uint256 base) external;
    function setXPRewardRate(uint256 rate) external;

    function pause() external;
    function unpause() external;
    function paused() external view returns (bool);
}
