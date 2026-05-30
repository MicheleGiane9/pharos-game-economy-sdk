import chalk from "chalk";

const prefix = chalk.cyan("[pharos-economy]");

export const logger = {
  info: (msg: string): void => {
    console.log(`${prefix} ${msg}`);
  },
  success: (msg: string): void => {
    console.log(`${prefix} ${chalk.green("✓")} ${msg}`);
  },
  warn: (msg: string): void => {
    console.log(`${prefix} ${chalk.yellow("⚠")} ${msg}`);
  },
  error: (msg: string): void => {
    console.error(`${prefix} ${chalk.red("✗")} ${msg}`);
  },
  step: (step: number, total: number, msg: string): void => {
    console.log(`${prefix} ${chalk.dim(`[${step}/${total}]`)} ${msg}`);
  },
  divider: (): void => {
    console.log(chalk.dim("─".repeat(50)));
  },
  blank: (): void => {
    console.log("");
  },
  banner: (): void => {
    console.log(chalk.cyan("\n╔══════════════════════════════════════════╗"));
    console.log(chalk.cyan("║") + chalk.bold("   Pharos Game Economy SDK  v1.0.0      ") + chalk.cyan("║"));
    console.log(chalk.cyan("║") + chalk.dim("   https://pharos.sh                    ") + chalk.cyan("║"));
    console.log(chalk.cyan("╚══════════════════════════════════════════╝\n"));
  },
};
