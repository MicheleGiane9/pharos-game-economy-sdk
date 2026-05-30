import { mkdirSync, existsSync, writeFileSync, copyFileSync } from "fs";
import { join, resolve } from "path";
import inquirer from "inquirer";
import ora from "ora";
import { logger } from "../utils/logger";
import {
  validateProjectName,
  validateTokenName,
  validateTokenSymbol,
  validateSupply,
  validateRewardAmount,
  validateNetwork,
  ValidationError,
} from "../utils/validation";
import { generateConfig, generateEnvExample, type EconomyParams } from "../generators/config-generator";
import {
  generateFrontendPackageJson,
  generateViteConfig,
  generateTailwindConfig,
  generateFrontendIndexHtml,
  generateFrontendTsConfig,
  generatePostcssConfig,
  scaffoldFrontendDirs,
} from "../generators/frontend-generator";
import { copyContracts, generateHardhatConfig } from "../generators/contract-generator";

export interface InitOptions {
  name?: string;
  token?: string;
  symbol?: string;
  supply?: string;
  daily?: string;
  output?: string;
  network?: string;
  yes?: boolean;
}

async function promptForParams(opts: InitOptions): Promise<EconomyParams> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Game project name:",
      default: opts.name || "My Pharos Game",
      validate: (v: string) => { validateProjectName(v); return true; },
      when: !opts.name,
    },
    {
      type: "input",
      name: "tokenName",
      message: "Reward token name (e.g. Dragon Gold):",
      default: opts.token || "Game Reward Token",
      validate: (v: string) => { validateTokenName(v); return true; },
      when: !opts.token,
    },
    {
      type: "input",
      name: "symbol",
      message: "Token ticker symbol (e.g. DGLD):",
      default: opts.symbol || "GRT",
      validate: (v: string) => { validateTokenSymbol(v); return true; },
      when: !opts.symbol,
    },
    {
      type: "input",
      name: "initialSupply",
      message: "Initial token supply (whole tokens):",
      default: "1000000",
      validate: (v: string) => { validateSupply(v); return true; },
    },
    {
      type: "input",
      name: "maxSupply",
      message: "Maximum token supply (whole tokens):",
      default: "1000000000",
      validate: (v: string) => { validateSupply(v); return true; },
    },
    {
      type: "input",
      name: "dailyReward",
      message: "Daily login reward (tokens per player):",
      default: opts.daily || "10",
      validate: (v: string) => { validateRewardAmount(v, "Daily reward"); return true; },
    },
    {
      type: "input",
      name: "questRewardBase",
      message: "Base quest completion reward (tokens):",
      default: "50",
    },
    {
      type: "input",
      name: "achievementReward",
      message: "Achievement unlock reward (tokens):",
      default: "100",
    },
    {
      type: "list",
      name: "network",
      message: "Target network:",
      choices: ["local", "testnet", "mainnet"],
      default: opts.network || "testnet",
    },
    {
      type: "input",
      name: "walletConnectProjectId",
      message: "WalletConnect Project ID (leave blank to add later):",
      default: "",
    },
  ]);

  const projectName = validateProjectName(opts.name || answers.projectName);
  const tokenName = validateTokenName(opts.token || answers.tokenName);
  const symbol = validateTokenSymbol(opts.symbol || answers.symbol);
  const initialSupply = validateSupply(answers.initialSupply);
  const maxSupply = validateSupply(answers.maxSupply);
  const dailyReward = validateRewardAmount(answers.dailyReward, "Daily reward");
  const questRewardBase = validateRewardAmount(answers.questRewardBase, "Quest reward base");
  const achievementReward = validateRewardAmount(answers.achievementReward, "Achievement reward");
  const network = validateNetwork(answers.network || opts.network || "testnet");

  if (maxSupply < initialSupply) {
    throw new ValidationError("Max supply must be greater than or equal to initial supply");
  }

  return {
    projectName,
    tokenName,
    symbol,
    initialSupply,
    maxSupply,
    dailyReward,
    questRewardBase,
    achievementReward,
    xpRewardRate: 0.01,
    network,
    walletConnectProjectId: answers.walletConnectProjectId || "",
  };
}

export async function runInit(opts: InitOptions): Promise<void> {
  logger.banner();

  let params: EconomyParams;
  try {
    params = await promptForParams(opts);
  } catch (e) {
    if (e instanceof ValidationError) {
      logger.error(e.message);
      process.exit(1);
    }
    throw e;
  }

  const outputDir = resolve(opts.output || `./${params.projectName.toLowerCase().replace(/\s+/g, "-")}`);

  if (existsSync(outputDir)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: `Directory "${outputDir}" already exists. Continue and overwrite?`,
        default: false,
      },
    ]);
    if (!overwrite) {
      logger.info("Aborted.");
      return;
    }
  }

  const totalSteps = 8;
  const spinner = ora();

  // Step 1: Create directory structure
  spinner.start("Creating project structure...");
  const dirs = [
    "",
    "contracts/interfaces",
    "scripts",
    "config",
    "test",
    "deployments",
    `frontend`,
  ];
  for (const d of dirs) mkdirSync(join(outputDir, d), { recursive: true });
  scaffoldFrontendDirs(join(outputDir, "frontend"));
  spinner.succeed(`[1/${totalSteps}] Project structure created`);

  // Step 2: Copy Solidity contracts
  spinner.start("Copying smart contracts...");
  const sdkRoot = join(__dirname, "..", "..");
  copyContracts(sdkRoot, outputDir);
  spinner.succeed(`[2/${totalSteps}] Smart contracts copied`);

  // Step 3: Copy deploy scripts
  spinner.start("Copying deployment scripts...");
  copyFileSync(join(sdkRoot, "scripts", "deploy.ts"), join(outputDir, "scripts", "deploy.ts"));
  copyFileSync(join(sdkRoot, "scripts", "verify.ts"), join(outputDir, "scripts", "verify.ts"));
  spinner.succeed(`[3/${totalSteps}] Deployment scripts copied`);

  // Step 4: Generate config
  spinner.start("Generating configuration...");
  generateConfig(params, outputDir);
  generateEnvExample(params, outputDir);
  spinner.succeed(`[4/${totalSteps}] Configuration generated`);

  // Step 5: Generate Hardhat config
  spinner.start("Generating Hardhat configuration...");
  generateHardhatConfig(outputDir);
  spinner.succeed(`[5/${totalSteps}] Hardhat configuration generated`);

  // Step 6: Generate package.json
  spinner.start("Generating package manifests...");
  writeProjectPackageJson(params, outputDir);
  generateFrontendPackageJson(params, join(outputDir, "frontend"));
  spinner.succeed(`[6/${totalSteps}] Package manifests generated`);

  // Step 7: Generate frontend
  spinner.start("Generating frontend dashboard...");
  generateViteConfig(join(outputDir, "frontend"));
  generateTailwindConfig(join(outputDir, "frontend"));
  generateFrontendIndexHtml(params, join(outputDir, "frontend"));
  generateFrontendTsConfig(join(outputDir, "frontend"));
  generatePostcssConfig(join(outputDir, "frontend"));
  spinner.succeed(`[7/${totalSteps}] Frontend scaffolded`);

  // Step 8: Write .gitignore and README
  spinner.start("Finalising project files...");
  writeGitignore(outputDir);
  spinner.succeed(`[8/${totalSteps}] Project finalised`);

  logger.blank();
  logger.divider();
  logger.success(`Project "${params.projectName}" created at ${outputDir}`);
  logger.blank();
  logger.info("Next steps:");
  logger.info(`  cd ${outputDir}`);
  logger.info("  npm install");
  logger.info("  cp .env.example .env   # add your PRIVATE_KEY");
  logger.info("  npm run deploy:testnet");
  logger.blank();
}

function writeProjectPackageJson(params: EconomyParams, outputDir: string): void {
  const slug = params.projectName.toLowerCase().replace(/\s+/g, "-");
  const pkg = {
    name: slug,
    version: "1.0.0",
    private: true,
    scripts: {
      compile: "hardhat compile",
      test: "hardhat test",
      "deploy:local": "hardhat run scripts/deploy.ts --network hardhat",
      "deploy:testnet": "hardhat run scripts/deploy.ts --network pharosTestnet",
      "deploy:mainnet": "hardhat run scripts/deploy.ts --network pharosMainnet",
      "verify:testnet": "hardhat run scripts/verify.ts --network pharosTestnet",
      "verify:mainnet": "hardhat run scripts/verify.ts --network pharosMainnet",
    },
    dependencies: { "@openzeppelin/contracts": "^5.0.2", dotenv: "^16.4.5" },
    devDependencies: {
      "@nomicfoundation/hardhat-toolbox": "^5.0.0",
      "@nomicfoundation/hardhat-verify": "^2.0.9",
      "@types/node": "^20.14.11",
      hardhat: "^2.22.7",
      "ts-node": "^10.9.2",
      typescript: "^5.5.3",
    },
  };
  writeFileSync(join(outputDir, "package.json"), JSON.stringify(pkg, null, 2));
}

function writeGitignore(outputDir: string): void {
  const content = `node_modules/\nfrontend/node_modules/\ndist/\nartifacts/\ncache/\ncoverage/\ntypechain-types/\n.env\n.env.local\ndeployments/\n*.log\n*.tsbuildinfo\n.DS_Store\n`;
  writeFileSync(join(outputDir, ".gitignore"), content);
}
