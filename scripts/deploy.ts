import { ethers, network } from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

dotenv.config();

interface DeployConfig {
  tokenName: string;
  tokenSymbol: string;
  initialSupply: bigint;
  maxSupply: bigint;
  dailyRewardAmount: bigint;
  questRewardBase: bigint;
  achievementRewardBase: bigint;
  xpRewardRate: bigint;
}

interface DeploymentResult {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  contracts: {
    GameRewardToken: string;
    RewardEngine: string;
  };
  config: {
    tokenName: string;
    tokenSymbol: string;
    initialSupply: string;
    maxSupply: string;
    dailyRewardAmount: string;
  };
  gasUsed: {
    GameRewardToken: string;
    RewardEngine: string;
    total: string;
  };
}

function getConfig(): DeployConfig {
  const ONE_TOKEN = ethers.parseEther("1");

  return {
    tokenName: process.env.TOKEN_NAME || "Game Reward Token",
    tokenSymbol: process.env.TOKEN_SYMBOL || "GRT",
    initialSupply: BigInt(process.env.INITIAL_SUPPLY || "1000000") * ONE_TOKEN,
    maxSupply: BigInt(process.env.MAX_SUPPLY || "1000000000") * ONE_TOKEN,
    dailyRewardAmount: BigInt(process.env.DAILY_REWARD || "10") * ONE_TOKEN,
    questRewardBase: BigInt(process.env.QUEST_REWARD_BASE || "50") * ONE_TOKEN,
    achievementRewardBase: BigInt(process.env.ACHIEVEMENT_REWARD_BASE || "100") * ONE_TOKEN,
    xpRewardRate: ethers.parseEther(process.env.XP_REWARD_RATE || "0.01"),
  };
}

async function main(): Promise<void> {
  const config = getConfig();
  const [deployer] = await ethers.getSigners();
  const networkInfo = await ethers.provider.getNetwork();
  const chainId = Number(networkInfo.chainId);

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   Pharos Game Economy — Deployment     ║");
  console.log("╚════════════════════════════════════════╝\n");
  console.log(`Network  : ${network.name} (chainId: ${chainId})`);
  console.log(`Deployer : ${deployer.address}`);
  console.log(`Balance  : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} PHRS\n`);
  console.log("Config:");
  console.log(`  Token Name     : ${config.tokenName}`);
  console.log(`  Token Symbol   : ${config.tokenSymbol}`);
  console.log(`  Initial Supply : ${ethers.formatEther(config.initialSupply)} ${config.tokenSymbol}`);
  console.log(`  Max Supply     : ${ethers.formatEther(config.maxSupply)} ${config.tokenSymbol}`);
  console.log(`  Daily Reward   : ${ethers.formatEther(config.dailyRewardAmount)} ${config.tokenSymbol}`);
  console.log("");

  // ── 1. Deploy GameRewardToken ──────────────────────────────────────────────
  console.log("Deploying GameRewardToken...");
  const TokenFactory = await ethers.getContractFactory("GameRewardToken");
  const token = await TokenFactory.deploy(
    config.tokenName,
    config.tokenSymbol,
    config.initialSupply,
    config.maxSupply,
    deployer.address
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  const tokenReceipt = await token.deploymentTransaction()!.wait(1);
  const tokenGas = tokenReceipt!.gasUsed.toString();

  console.log(`  ✓ GameRewardToken deployed at: ${tokenAddress}`);
  console.log(`    Gas used: ${tokenGas}\n`);

  // ── 2. Deploy RewardEngine ────────────────────────────────────────────────
  console.log("Deploying RewardEngine...");
  const EngineFactory = await ethers.getContractFactory("RewardEngine");
  const engine = await EngineFactory.deploy(
    tokenAddress,
    deployer.address,
    config.dailyRewardAmount,
    config.questRewardBase,
    config.achievementRewardBase,
    config.xpRewardRate
  );
  await engine.waitForDeployment();
  const engineAddress = await engine.getAddress();
  const engineReceipt = await engine.deploymentTransaction()!.wait(1);
  const engineGas = engineReceipt!.gasUsed.toString();

  console.log(`  ✓ RewardEngine deployed at: ${engineAddress}`);
  console.log(`    Gas used: ${engineGas}\n`);

  // ── 3. Grant MINTER_ROLE to RewardEngine ─────────────────────────────────
  console.log("Granting MINTER_ROLE to RewardEngine...");
  const MINTER_ROLE = await token.MINTER_ROLE();
  const grantTx = await token.grantRole(MINTER_ROLE, engineAddress);
  await grantTx.wait(1);
  console.log("  ✓ MINTER_ROLE granted\n");

  // ── 4. Persist deployment record ─────────────────────────────────────────
  const totalGas = (BigInt(tokenGas) + BigInt(engineGas)).toString();

  const result: DeploymentResult = {
    network: network.name,
    chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      GameRewardToken: tokenAddress,
      RewardEngine: engineAddress,
    },
    config: {
      tokenName: config.tokenName,
      tokenSymbol: config.tokenSymbol,
      initialSupply: ethers.formatEther(config.initialSupply),
      maxSupply: ethers.formatEther(config.maxSupply),
      dailyRewardAmount: ethers.formatEther(config.dailyRewardAmount),
    },
    gasUsed: {
      GameRewardToken: tokenGas,
      RewardEngine: engineGas,
      total: totalGas,
    },
  };

  const deploymentsDir = join(process.cwd(), "deployments");
  if (!existsSync(deploymentsDir)) mkdirSync(deploymentsDir, { recursive: true });

  const outPath = join(deploymentsDir, `${network.name}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log("╔════════════════════════════════════════╗");
  console.log("║           Deployment Complete          ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`  GameRewardToken : ${tokenAddress}`);
  console.log(`  RewardEngine    : ${engineAddress}`);
  console.log(`  Total gas used  : ${totalGas}`);
  console.log(`  Saved to        : ${outPath}\n`);

  console.log("Next steps:");
  console.log(`  1. Update your frontend .env:`);
  console.log(`     VITE_GAME_REWARD_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`     VITE_REWARD_ENGINE_ADDRESS=${engineAddress}`);
  console.log(`     VITE_CHAIN_ID=${chainId}`);
  console.log(`  2. Verify contracts: npm run verify:${network.name === "pharosTestnet" ? "testnet" : "mainnet"}`);
  console.log(`  3. Grant OPERATOR_ROLE to your game server address\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
