import { run, network } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

interface DeploymentRecord {
  contracts: { GameRewardToken: string; RewardEngine: string };
  config: {
    tokenName: string;
    tokenSymbol: string;
    initialSupply: string;
    maxSupply: string;
    dailyRewardAmount: string;
  };
}

async function main(): Promise<void> {
  const deploymentPath = join(process.cwd(), "deployments", `${network.name}.json`);

  let deployment: DeploymentRecord;
  try {
    deployment = JSON.parse(readFileSync(deploymentPath, "utf-8")) as DeploymentRecord;
  } catch {
    throw new Error(
      `No deployment found for network "${network.name}". Run deploy first.`
    );
  }

  const { contracts, config } = deployment;
  const [deployer] = await ethers.getSigners();

  const ONE_TOKEN = ethers.parseEther("1");
  const initialSupply = BigInt(Math.floor(parseFloat(config.initialSupply))) * ONE_TOKEN;
  const maxSupply = BigInt(Math.floor(parseFloat(config.maxSupply))) * ONE_TOKEN;
  const dailyRewardAmount = BigInt(Math.floor(parseFloat(config.dailyRewardAmount))) * ONE_TOKEN;

  console.log(`\nVerifying contracts on ${network.name}...\n`);

  // Verify GameRewardToken
  console.log(`Verifying GameRewardToken at ${contracts.GameRewardToken}...`);
  try {
    await run("verify:verify", {
      address: contracts.GameRewardToken,
      constructorArguments: [
        config.tokenName,
        config.tokenSymbol,
        initialSupply,
        maxSupply,
        deployer.address,
      ],
    });
    console.log("  ✓ GameRewardToken verified\n");
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Already Verified")) {
      console.log("  ✓ GameRewardToken already verified\n");
    } else {
      console.error("  ✗ GameRewardToken verification failed:", e);
    }
  }

  // Verify RewardEngine
  const questRewardBase = BigInt(process.env.QUEST_REWARD_BASE || "50") * ONE_TOKEN;
  const achievementRewardBase = BigInt(process.env.ACHIEVEMENT_REWARD_BASE || "100") * ONE_TOKEN;
  const xpRewardRate = ethers.parseEther(process.env.XP_REWARD_RATE || "0.01");

  console.log(`Verifying RewardEngine at ${contracts.RewardEngine}...`);
  try {
    await run("verify:verify", {
      address: contracts.RewardEngine,
      constructorArguments: [
        contracts.GameRewardToken,
        deployer.address,
        dailyRewardAmount,
        questRewardBase,
        achievementRewardBase,
        xpRewardRate,
      ],
    });
    console.log("  ✓ RewardEngine verified\n");
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Already Verified")) {
      console.log("  ✓ RewardEngine already verified\n");
    } else {
      console.error("  ✗ RewardEngine verification failed:", e);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
