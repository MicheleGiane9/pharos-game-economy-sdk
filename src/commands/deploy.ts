import { execSync } from "child_process";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { logger } from "../utils/logger";
import { validateNetwork } from "../utils/validation";

export interface DeployOptions {
  network?: string;
  verify?: boolean;
  dir?: string;
}

export async function runDeploy(opts: DeployOptions): Promise<void> {
  const network = validateNetwork(opts.network || "testnet");
  const projectDir = resolve(opts.dir || process.cwd());

  if (!existsSync(join(projectDir, "hardhat.config.ts"))) {
    logger.error(
      "No hardhat.config.ts found. Run `pharos-economy init` first or use --dir <project-path>."
    );
    process.exit(1);
  }

  const hardhatNetwork =
    network === "local" ? "hardhat" : network === "testnet" ? "pharosTestnet" : "pharosMainnet";

  logger.banner();
  logger.info(`Deploying to ${network} (${hardhatNetwork})...`);
  logger.blank();

  const envCheck = network !== "local" && !process.env.PRIVATE_KEY;
  if (envCheck) {
    logger.error("PRIVATE_KEY is not set. Add it to your .env file.");
    process.exit(1);
  }

  try {
    logger.step(1, 2, "Compiling contracts...");
    execSync("npx hardhat compile", { cwd: projectDir, stdio: "inherit" });
    logger.success("Contracts compiled");
    logger.blank();

    logger.step(2, 2, "Running deployment script...");
    execSync(`npx hardhat run scripts/deploy.ts --network ${hardhatNetwork}`, {
      cwd: projectDir,
      stdio: "inherit",
    });
    logger.blank();

    if (opts.verify && network !== "local") {
      logger.info("Verifying contracts on block explorer...");
      execSync(`npx hardhat run scripts/verify.ts --network ${hardhatNetwork}`, {
        cwd: projectDir,
        stdio: "inherit",
      });
    }

    logger.success("Deployment complete.");
  } catch (error) {
    logger.error(`Deployment failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
