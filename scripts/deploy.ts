import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // ── Configuration ──────────────────────────────────────────────────
  const pair           = process.env.PAIR            || "BTC/USD";
  const roundDuration  = parseInt(process.env.ROUND_DURATION  || "120");   // 2 minutes default
  const lockBuffer     = parseInt(process.env.LOCK_BUFFER     || "10");    // 10 seconds
  const minBetAmount   = process.env.MIN_BET_AMOUNT  || ethers.parseEther("0.1").toString();
  const protocolFeeBps = parseInt(process.env.PROTOCOL_FEE_BPS || "300");  // 3 %
  const keeperAddress  = process.env.KEEPER_ADDRESS;

  if (!keeperAddress) {
    throw new Error("KEEPER_ADDRESS is required in .env");
  }

  console.log("┌──────────────────────────────────────────────────┐");
  console.log("│    dotMarket — RoundMarket Deploy (No Pyth)      │");
  console.log("├──────────────────────────────────────────────────┤");
  console.log(`│  Pair:           ${pair}`);
  console.log(`│  Round Duration: ${roundDuration}s`);
  console.log(`│  Lock Buffer:    ${lockBuffer}s`);
  console.log(`│  Min Bet:        ${ethers.formatEther(minBetAmount)} ETH/USDC`);
  console.log(`│  Protocol Fee:   ${protocolFeeBps / 100}%`);
  console.log(`│  Keeper:         ${keeperAddress}`);
  console.log("└──────────────────────────────────────────────────┘");

  // ── Deploy ─────────────────────────────────────────────────────────
  const RoundMarket = await ethers.getContractFactory("RoundMarket");

  console.log("\n⏳ Deploying RoundMarket...");

  const market = await RoundMarket.deploy(
    pair,
    roundDuration,
    lockBuffer,
    minBetAmount,
    protocolFeeBps,
    keeperAddress
  );

  await market.waitForDeployment();

  const deployedAddress = await market.getAddress();

  console.log(`\n✅ RoundMarket deployed to: ${deployedAddress}`);
  console.log(`\n📋 Save this to your .env files:`);
  console.log(`   MARKET_ADDRESS=${deployedAddress}`);
  console.log(`\n🔍 Verify on ArcScan: https://testnet.arcscan.app/address/${deployedAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
