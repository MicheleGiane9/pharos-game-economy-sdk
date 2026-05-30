using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace Pharos.GameEconomy
{
    /// <summary>
    /// Unity C# bridge for the Pharos Game Economy SDK.
    ///
    /// Usage:
    ///   1. Add this component to any persistent GameObject (e.g. GameManager).
    ///   2. Fill in ServerBaseUrl and ApiKey in the Inspector.
    ///   3. Your game server must expose the /api/reward endpoint using the SDK's
    ///      GameRewardServer class (see examples/browser-game/economy-integration.ts).
    ///
    /// The bridge communicates with your backend API which handles private-key signing.
    /// The private key NEVER leaves the server.
    /// </summary>
    public class PharosEconomyBridge : MonoBehaviour
    {
        [Header("Server Configuration")]
        [Tooltip("Base URL of your game server API (e.g. https://api.mygame.com)")]
        public string ServerBaseUrl = "https://api.mygame.com";

        [Tooltip("API key for authenticating with your game server")]
        public string ApiKey = "";

        [Header("Economy Dashboard")]
        [Tooltip("URL of the Pharos reward dashboard for players to claim rewards")]
        public string DashboardUrl = "https://economy.mygame.com";

        [Header("Debug")]
        public bool VerboseLogging = false;

        public static PharosEconomyBridge Instance { get; private set; }

        // Events
        public static event Action<string, float> OnRewardGranted;
        public static event Action<string> OnRewardError;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        // ── Public API ──────────────────────────────────────────────────────────

        /// <summary>
        /// Grant tokens to a player for killing a monster.
        /// </summary>
        public void RewardMonsterKill(string playerAddress, string monsterId, float tokenAmount)
        {
            string rewardId = GenerateRewardId("kill", playerAddress, monsterId);
            StartCoroutine(PostReward(new RewardRequest
            {
                playerAddress = playerAddress,
                amount = tokenAmount.ToString("F2"),
                rewardType = "kill",
                rewardId = rewardId,
                metadata = new Dictionary<string, string> { { "monsterId", monsterId } }
            }));
        }

        /// <summary>
        /// Grant tokens to a player for completing a quest.
        /// </summary>
        public void RewardQuestCompletion(string playerAddress, string questId, float tokenAmount)
        {
            string rewardId = GenerateRewardId("quest", playerAddress, questId);
            StartCoroutine(PostReward(new RewardRequest
            {
                playerAddress = playerAddress,
                amount = tokenAmount.ToString("F2"),
                rewardType = "quest",
                rewardId = rewardId,
                metadata = new Dictionary<string, string> { { "questId", questId } }
            }));
        }

        /// <summary>
        /// Grant tokens to a player for unlocking an achievement.
        /// </summary>
        public void RewardAchievement(string playerAddress, string achievementId, float tokenAmount)
        {
            string rewardId = GenerateRewardId("achievement", playerAddress, achievementId);
            StartCoroutine(PostReward(new RewardRequest
            {
                playerAddress = playerAddress,
                amount = tokenAmount.ToString("F2"),
                rewardType = "achievement",
                rewardId = rewardId,
                metadata = new Dictionary<string, string> { { "achievementId", achievementId } }
            }));
        }

        /// <summary>
        /// Grant tokens to a player for levelling up.
        /// </summary>
        public void RewardLevelUp(string playerAddress, int newLevel)
        {
            float amount = newLevel * 20f;
            string rewardId = GenerateRewardId("levelup", playerAddress, newLevel.ToString());
            StartCoroutine(PostReward(new RewardRequest
            {
                playerAddress = playerAddress,
                amount = amount.ToString("F2"),
                rewardType = "levelup",
                rewardId = rewardId,
                metadata = new Dictionary<string, string> { { "level", newLevel.ToString() } }
            }));
        }

        /// <summary>
        /// Grant XP-scaled reward.
        /// </summary>
        public void RewardXP(string playerAddress, int xpGained)
        {
            float amount = xpGained * 0.01f;
            if (amount < 0.01f) return;

            string rewardId = GenerateRewardId("xp", playerAddress, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString());
            StartCoroutine(PostReward(new RewardRequest
            {
                playerAddress = playerAddress,
                amount = amount.ToString("F4"),
                rewardType = "xp",
                rewardId = rewardId,
                metadata = new Dictionary<string, string> { { "xp", xpGained.ToString() } }
            }));
        }

        /// <summary>
        /// Send a batch of rewards in a single server call.
        /// More efficient for high-frequency events.
        /// </summary>
        public void RewardBatch(List<BatchEntry> entries)
        {
            if (entries == null || entries.Count == 0) return;
            StartCoroutine(PostBatchReward(entries));
        }

        /// <summary>
        /// Open the reward dashboard in the system browser so the player can claim tokens.
        /// </summary>
        public void OpenDashboard()
        {
            Application.OpenURL(DashboardUrl);
        }

        /// <summary>
        /// Get the pending reward amount for a player (calls your server API).
        /// </summary>
        public void GetPendingRewards(string playerAddress, Action<float> callback)
        {
            StartCoroutine(GetPendingRewardsCoroutine(playerAddress, callback));
        }

        // ── Internal ────────────────────────────────────────────────────────────

        private IEnumerator PostReward(RewardRequest request)
        {
            string json = JsonUtility.ToJson(request);
            byte[] body = Encoding.UTF8.GetBytes(json);

            using UnityWebRequest www = new UnityWebRequest($"{ServerBaseUrl}/api/reward", "POST");
            www.uploadHandler = new UploadHandlerRaw(body);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");
            www.SetRequestHeader("X-Api-Key", ApiKey);

            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                float amount = float.TryParse(request.amount, out float f) ? f : 0f;
                OnRewardGranted?.Invoke(request.rewardType, amount);

                if (VerboseLogging)
                    Debug.Log($"[Pharos] Reward granted: {request.amount} tokens ({request.rewardType}) → {request.playerAddress}");
            }
            else
            {
                string err = $"Reward API error: {www.error} — {www.downloadHandler.text}";
                Debug.LogWarning($"[Pharos] {err}");
                OnRewardError?.Invoke(err);
            }
        }

        private IEnumerator PostBatchReward(List<BatchEntry> entries)
        {
            string json = $"{{\"entries\":{JsonHelper.ToJson(entries)}}}";
            byte[] body = Encoding.UTF8.GetBytes(json);

            using UnityWebRequest www = new UnityWebRequest($"{ServerBaseUrl}/api/reward/batch", "POST");
            www.uploadHandler = new UploadHandlerRaw(body);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");
            www.SetRequestHeader("X-Api-Key", ApiKey);

            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                if (VerboseLogging)
                    Debug.Log($"[Pharos] Batch reward sent: {entries.Count} entries");
            }
            else
            {
                Debug.LogWarning($"[Pharos] Batch reward error: {www.error}");
                OnRewardError?.Invoke(www.error);
            }
        }

        private IEnumerator GetPendingRewardsCoroutine(string playerAddress, Action<float> callback)
        {
            using UnityWebRequest www = UnityWebRequest.Get($"{ServerBaseUrl}/api/player/{playerAddress}/pending");
            www.SetRequestHeader("X-Api-Key", ApiKey);

            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                var response = JsonUtility.FromJson<PendingRewardsResponse>(www.downloadHandler.text);
                callback?.Invoke(response.pendingTokens);
            }
            else
            {
                Debug.LogWarning($"[Pharos] GetPendingRewards error: {www.error}");
                callback?.Invoke(0f);
            }
        }

        private static string GenerateRewardId(string type, string player, string eventId)
        {
            long ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            return $"{type}-{player.Substring(2, 6).ToLower()}-{eventId}-{ts}";
        }
    }

    // ── Data classes ────────────────────────────────────────────────────────────

    [Serializable]
    public class RewardRequest
    {
        public string playerAddress;
        public string amount;
        public string rewardType;
        public string rewardId;
        public Dictionary<string, string> metadata;
    }

    [Serializable]
    public class BatchEntry
    {
        public string player;
        public string amount;
        public string reason;
    }

    [Serializable]
    public class PendingRewardsResponse
    {
        public float pendingTokens;
        public string formattedAmount;
    }

    /// <summary>Minimal helper for serialising List<T> since JsonUtility does not support it directly.</summary>
    public static class JsonHelper
    {
        public static string ToJson<T>(List<T> list)
        {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.Count; i++)
            {
                sb.Append(JsonUtility.ToJson(list[i]));
                if (i < list.Count - 1) sb.Append(",");
            }
            sb.Append("]");
            return sb.ToString();
        }
    }
}
