import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const pair           = process.env.PAIR            || "BTC/USD";
  const minBetAmount   = process.env.MIN_BET_AMOUNT  || ethers.parseEther("0.1").toString();
  const protocolFeeBps = parseInt(process.env.PROTOCOL_FEE_BPS || "300");  // 3%
  const virtualUp      = ethers.parseEther("1000"); // 1000 USDC seed
  const virtualDown    = ethers.parseEther("1000"); // 1000 USDC seed
  const keeperAddress  = process.env.KEEPER_ADDRESS;

  if (!keeperAddress) {
    throw new Error("KEEPER_ADDRESS is required in .env");
  }

  console.log("┌──────────────────────────────────────────────────┐");
  console.log("│  dotMarket — ContinuousMarket Deploy (USDC Gas)  │");
  console.log("├──────────────────────────────────────────────────┤");
  console.log(`│  Pair:           ${pair}`);
  console.log(`│  Min Bet:        ${ethers.formatEther(minBetAmount)} USDC`);
  console.log(`│  Protocol Fee:   ${protocolFeeBps / 100}%`);
  console.log(`│  Virtual Up:     ${ethers.formatEther(virtualUp)} USDC`);
  console.log(`│  Virtual Down:   ${ethers.formatEther(virtualDown)} USDC`);
  console.log(`│  Keeper:         ${keeperAddress}`);
  console.log("└──────────────────────────────────────────────────┘");

  // Deploy ContinuousMarket
  const ContinuousMarket = await ethers.getContractFactory("ContinuousMarket");

  console.log("\n⏳ Deploying ContinuousMarket...");

  const market = await ContinuousMarket.deploy(
    pair,
    minBetAmount,
    protocolFeeBps,
    virtualUp,
    virtualDown,
    keeperAddress
  );

  await market.waitForDeployment();

  const deployedAddress = await market.getAddress();

  console.log(`\n✅ ContinuousMarket deployed to: ${deployedAddress}`);
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
