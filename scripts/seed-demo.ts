import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const deploymentsPath = path.join(__dirname, "../deployments/localhost.json");

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments/localhost.json not found. Run deploy first.");
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const tokenAddress = deployments.contracts.GameRewardToken;
  const engineAddress = deployments.contracts.RewardEngine;

  const [deployer, player] = await ethers.getSigners();

  console.log("╔════════════════════════════════════════╗");
  console.log("║       Pharos Economy — Demo Seed       ║");
  console.log("╚════════════════════════════════════════╝\n");
  console.log(`Deployer : ${deployer.address}`);
  console.log(`Player   : ${player.address}`);
  console.log(`Token    : ${tokenAddress}`);
  console.log(`Engine   : ${engineAddress}\n`);

  const engine = await ethers.getContractAt("RewardEngine", engineAddress);

  // Seed multiple reward types for the demo
  const rewards = [
    { type: "daily",       amount: ethers.parseEther("10"),  id: ethers.encodeBytes32String("demo-daily-001") },
    { type: "quest",       amount: ethers.parseEther("50"),  id: ethers.encodeBytes32String("demo-quest-001") },
    { type: "achievement", amount: ethers.parseEther("100"), id: ethers.encodeBytes32String("demo-achieve-001") },
    { type: "kill",        amount: ethers.parseEther("25"),  id: ethers.encodeBytes32String("demo-kill-001") },
  ];

  for (const r of rewards) {
    await engine.rewardPlayer(player.address, r.amount, r.type, r.id);
    console.log(`  ✓ ${r.type.padEnd(12)} +${ethers.formatEther(r.amount)} tokens  →  ${player.address}`);
  }

  const pending = await engine.getPendingRewards(player.address);
  console.log(`\nTotal pending for player: ${ethers.formatEther(pending)} GRT`);
  console.log("\n✅ Seed complete! Now connect MetaMask with account #1:");
  console.log("   Address    : " + player.address);
  console.log("   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  console.log("\n   Network settings for MetaMask:");
  console.log("   RPC        : http://127.0.0.1:8545");
  console.log("   Chain ID   : 31337");
  console.log("   Symbol     : ETH");
  console.log("\n   Open the dashboard: http://localhost:5173");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
