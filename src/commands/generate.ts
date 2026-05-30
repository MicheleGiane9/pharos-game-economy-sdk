import { existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import ora from "ora";
import { logger } from "../utils/logger";
import {
  generateFrontendPackageJson,
  generateViteConfig,
  generateTailwindConfig,
  generateFrontendIndexHtml,
  generateFrontendTsConfig,
  generatePostcssConfig,
  scaffoldFrontendDirs,
} from "../generators/frontend-generator";
import type { EconomyParams } from "../generators/config-generator";

export interface GenerateOptions {
  output?: string;
  dir?: string;
}

export async function runGenerate(opts: GenerateOptions): Promise<void> {
  const projectDir = resolve(opts.dir || process.cwd());
  const configPath = join(projectDir, "config", "game-economy.config.ts");

  if (!existsSync(configPath)) {
    logger.error(
      "No config/game-economy.config.ts found. Run `pharos-economy init` first."
    );
    process.exit(1);
  }

  logger.banner();
  logger.info("Generating frontend dashboard...");

  const frontendDir = resolve(opts.output || join(projectDir, "frontend"));
  mkdirSync(frontendDir, { recursive: true });
  scaffoldFrontendDirs(frontendDir);

  const spinner = ora();

  // We load a minimal params object from the config file at runtime.
  // In a real install, dynamic import works; here we derive from the TS source.
  const params = loadParamsFromConfig(projectDir);

  spinner.start("Generating package manifests...");
  generateFrontendPackageJson(params, frontendDir);
  spinner.succeed("package.json written");

  spinner.start("Generating build config...");
  generateViteConfig(frontendDir);
  generateTailwindConfig(frontendDir);
  generatePostcssConfig(frontendDir);
  spinner.succeed("Vite + Tailwind config written");

  spinner.start("Generating HTML entry...");
  generateFrontendIndexHtml(params, frontendDir);
  spinner.succeed("index.html written");

  spinner.start("Generating TypeScript config...");
  generateFrontendTsConfig(frontendDir);
  spinner.succeed("tsconfig written");

  logger.blank();
  logger.success(`Frontend generated at ${frontendDir}`);
  logger.info(`Run: cd ${frontendDir} && npm install && npm run dev`);
}

function loadParamsFromConfig(projectDir: string): EconomyParams {
  // Parse config values from the generated TS file using regex for portability.
  // A build step would allow dynamic import, but we want zero-dependency generation.
  const { readFileSync } = require("fs");
  const src = readFileSync(join(projectDir, "config", "game-economy.config.ts"), "utf-8");

  const extract = (key: string, defaultVal: string): string => {
    const m = src.match(new RegExp(`${key}:\\s*([^,\\n]+)`));
    return m ? m[1].trim().replace(/["']/g, "") : defaultVal;
  };

  return {
    projectName: extract("appName", "Game Economy"),
    tokenName: extract("tokenName", "Game Reward Token"),
    symbol: extract("symbol", "GRT"),
    initialSupply: parseInt(extract("initialSupply", "1000000"), 10),
    maxSupply: parseInt(extract("maxSupply", "1000000000"), 10),
    dailyReward: parseFloat(extract("dailyReward", "10")),
    questRewardBase: parseFloat(extract("questRewardBase", "50")),
    achievementReward: parseFloat(extract("achievementReward", "100")),
    xpRewardRate: parseFloat(extract("xpRewardRate", "0.01")),
    network: "testnet",
    walletConnectProjectId: "",
  };
}
