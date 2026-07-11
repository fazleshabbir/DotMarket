import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const marketAddress = "0x31Aeb323aEE44e3EE5036F14bBD0D7f1429B4938";
  
  console.log(`Updating parameters to 1-minute cycles on contract at: ${marketAddress}`);
  
  const market = await ethers.getContractAt("RoundMarket", marketAddress);
  
  // 1. Set Lock Buffer to 60 seconds (1 minute) first, since roundDuration is currently 240
  console.log("Setting lock buffer to 60s...");
  const tx1 = await market.setLockBuffer(60);
  await tx1.wait();
  console.log("✓ Lock buffer set to 60s");
  
  // 2. Set Round Duration to 120 seconds (2 minutes total)
  console.log("Setting round duration to 120s...");
  const tx2 = await market.setRoundDuration(120);
  await tx2.wait();
  console.log("✓ Round duration set to 120s");
  
  console.log("Configuration parameters successfully updated to 1-minute open + 1-minute settling on-chain!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error updating contract parameters:", error);
    process.exit(1);
  });
