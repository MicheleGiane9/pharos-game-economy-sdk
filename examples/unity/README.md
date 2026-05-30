# Unity Integration — Pharos Game Economy SDK

## Setup

### 1. Add the bridge to your scene

1. Copy `PharosEconomyBridge.cs` into your Unity project's `Assets/Scripts/Pharos/` folder.
2. Add the `PharosEconomyBridge` component to a persistent GameObject (e.g. your `GameManager`).
3. Fill in the Inspector fields:
   - **Server Base URL** — your game server address (e.g. `https://api.yourgame.com`)
   - **API Key** — secret key your server validates
   - **Dashboard URL** — the Pharos reward dashboard URL for players

### 2. Run your game server

Your Node.js game server must handle reward granting using the SDK:

```typescript
// server.ts
import express from "express";
import { GameRewardServer } from "pharos-game-economy-sdk";
import * as dotenv from "dotenv";

dotenv.config();

const rewardServer = new GameRewardServer({
  rewardEngineAddress: process.env.REWARD_ENGINE_ADDRESS!,
  chainId: 688688,
  rpcUrl: "https://testnet.pharos.sh",
  serverSignerPrivateKey: process.env.PRIVATE_KEY!,
});

const app = express();
app.use(express.json());

// Middleware: validate API key
app.use((req, res, next) => {
  if (req.headers["x-api-key"] !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.post("/api/reward", async (req, res) => {
  const { playerAddress, amount, rewardType, rewardId } = req.body;

  try {
    const txHash = await rewardServer.rewardPlayer({
      player: playerAddress,
      amount,
      rewardType,
      rewardId,
    });
    res.json({ success: true, txHash });
  } catch (error) {
    console.error("Reward error:", error);
    res.status(500).json({ error: "Reward granting failed" });
  }
});

app.post("/api/reward/batch", async (req, res) => {
  const { entries } = req.body;

  try {
    const txHash = await rewardServer.rewardBatch(entries);
    res.json({ success: true, txHash });
  } catch (error) {
    console.error("Batch reward error:", error);
    res.status(500).json({ error: "Batch reward failed" });
  }
});

app.get("/api/player/:address/pending", async (req, res) => {
  // Query on-chain pending rewards
  // Implement using ethers.js contract read
  res.json({ pendingTokens: 0, formattedAmount: "0" });
});

app.listen(3000, () => console.log("Game server running on port 3000"));
```

### 3. Use in Unity scripts

```csharp
using Pharos.GameEconomy;

public class MonsterController : MonoBehaviour
{
    public string playerWalletAddress; // Set from wallet connection flow

    void OnMonsterDied()
    {
        // Grant reward via the Pharos economy
        PharosEconomyBridge.Instance.RewardMonsterKill(
            playerWalletAddress,
            "dragon-boss-001",
            50f  // 50 DGLD tokens
        );
    }
}

public class QuestManager : MonoBehaviour
{
    void OnQuestCompleted(Quest quest, string playerAddress)
    {
        PharosEconomyBridge.Instance.RewardQuestCompletion(
            playerAddress,
            quest.id,
            quest.tokenReward
        );
    }
}

public class UIManager : MonoBehaviour
{
    public void OnClaimButtonPressed()
    {
        // Opens the Pharos dashboard in the system browser
        PharosEconomyBridge.Instance.OpenDashboard();
    }
}
```

### 4. Subscribe to economy events

```csharp
void Start()
{
    PharosEconomyBridge.OnRewardGranted += HandleRewardGranted;
    PharosEconomyBridge.OnRewardError   += HandleRewardError;
}

void OnDestroy()
{
    PharosEconomyBridge.OnRewardGranted -= HandleRewardGranted;
    PharosEconomyBridge.OnRewardError   -= HandleRewardError;
}

void HandleRewardGranted(string rewardType, float amount)
{
    Debug.Log($"Reward granted: {amount} tokens ({rewardType})");
    // Show in-game notification
}

void HandleRewardError(string error)
{
    Debug.LogWarning($"Reward error: {error}");
}
```

## Architecture

```
Unity Game                    Game Server                  Pharos Network
─────────────────             ─────────────────────        ───────────────
Player kills boss    ──→      POST /api/reward       ──→   RewardEngine
                              (signed by OPERATOR)          .rewardPlayer()
                                                           
Player opens menu    ──→      Dashboard URL          ──→   Player wallet
"Claim Rewards"               (React app)                  .claimReward()
```

## Security notes

- The deployer's **private key never touches Unity or the browser**.
- All reward granting is done server-side by your Node.js backend.
- Validate player identity (auth token, session ID) in your API middleware before granting.
- Use the `rewardId` system to prevent duplicate rewards on server restart.
