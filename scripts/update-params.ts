import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const marketAddress = "0x31Aeb323aEE44e3EE5036F14bBD0D7f1429B4938";
  
  console.log(`Updating parameters on contract at: ${marketAddress}`);
  
  const market = await ethers.getContractAt("RoundMarket", marketAddress);
  
  // 1. Set Round Duration to 240 seconds (4 minutes)
  console.log("Setting round duration to 240s...");
  const tx1 = await market.setRoundDuration(240);
  await tx1.wait();
  console.log("✓ Round duration set to 240s");
  
  // 2. Set Lock Buffer to 120 seconds (2 minutes)
  console.log("Setting lock buffer to 120s...");
  const tx2 = await market.setLockBuffer(120);
  await tx2.wait();
  console.log("✓ Lock buffer set to 120s");
  
  console.log("Configuration parameters successfully updated on-chain!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error updating contract parameters:", error);
    process.exit(1);
  });
