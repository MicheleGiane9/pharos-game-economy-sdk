#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "./commands/init";
import { runDeploy } from "./commands/deploy";
import { runGenerate } from "./commands/generate";
import { logger } from "./utils/logger";

const program = new Command();

program
  .name("pharos-economy")
  .description("Pharos Game Economy SDK — add a complete Web3 economy to any game")
  .version("1.0.0");

program
  .command("init")
  .description("Scaffold a new game economy project")
  .option("-n, --name <name>", "Game project name")
  .option("-t, --token <tokenName>", "ERC20 reward token name (e.g. Dragon Gold)")
  .option("-s, --symbol <symbol>", "Token ticker symbol (e.g. DGLD)")
  .option("--supply <amount>", "Initial token supply in whole tokens")
  .option("-d, --daily <amount>", "Daily reward amount per player")
  .option("-o, --output <path>", "Output directory")
  .option("--network <network>", "Target network: local | testnet | mainnet", "testnet")
  .option("-y, --yes", "Skip confirmation prompts")
  .action(async (opts) => {
    try {
      await runInit(opts);
    } catch (e) {
      logger.error(`Unexpected error: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("deploy")
  .description("Compile and deploy game economy contracts")
  .option("--network <network>", "Target network: local | testnet | mainnet", "testnet")
  .option("--verify", "Verify contracts on block explorer after deployment")
  .option("--dir <path>", "Project directory (default: current directory)")
  .action(async (opts) => {
    try {
      await runDeploy(opts);
    } catch (e) {
      logger.error(`Deployment error: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("generate")
  .description("Regenerate the React frontend dashboard")
  .option("-o, --output <path>", "Output path for frontend (default: ./frontend)")
  .option("--dir <path>", "Project directory (default: current directory)")
  .action(async (opts) => {
    try {
      await runGenerate(opts);
    } catch (e) {
      logger.error(`Generation error: ${(e as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Show deployed economy status on-chain")
  .option("--network <network>", "Network to query: testnet | mainnet", "testnet")
  .option("--dir <path>", "Project directory (default: current directory)")
  .action(async (opts) => {
    const { readFileSync, existsSync } = await import("fs");
    const { join, resolve } = await import("path");

    const projectDir = resolve(opts.dir || process.cwd());
    const networkName = opts.network === "mainnet" ? "pharosMainnet" : "pharosTestnet";
    const deploymentPath = join(projectDir, "deployments", `${networkName}.json`);

    if (!existsSync(deploymentPath)) {
      logger.error(`No deployment record found for ${networkName}. Deploy first.`);
      process.exit(1);
    }

    const deployment = JSON.parse(readFileSync(deploymentPath, "utf-8"));
    logger.banner();
    logger.info(`Network  : ${deployment.network}`);
    logger.info(`Deployer : ${deployment.deployer}`);
    logger.info(`Deployed : ${deployment.timestamp}`);
    logger.blank();
    logger.info(`GameRewardToken : ${deployment.contracts.GameRewardToken}`);
    logger.info(`RewardEngine    : ${deployment.contracts.RewardEngine}`);
    logger.blank();
    logger.info(`Token name   : ${deployment.config.tokenName} (${deployment.config.tokenSymbol})`);
    logger.info(`Daily reward : ${deployment.config.dailyRewardAmount} ${deployment.config.tokenSymbol}`);
  });

program.parse(process.argv);
