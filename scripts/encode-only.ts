import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const pair           = process.env.PAIR            || "BTC/USD";
  const roundDuration  = parseInt(process.env.ROUND_DURATION  || "120");
  const lockBuffer     = parseInt(process.env.LOCK_BUFFER     || "10");
  const minBetAmount   = process.env.MIN_BET_AMOUNT  || ethers.parseEther("0.1").toString();
  const protocolFeeBps = parseInt(process.env.PROTOCOL_FEE_BPS || "300");
  const keeperAddress  = process.env.KEEPER_ADDRESS || "0xfE3194467285B20Db62EBf4Fdda7aADEFEC321ED";

  console.log("─── Constructor Parameters from .env ───");
  console.log("pair:", pair);
  console.log("roundDuration:", roundDuration);
  console.log("lockBuffer:", lockBuffer);
  console.log("minBetAmount:", minBetAmount);
  console.log("protocolFeeBps:", protocolFeeBps);
  console.log("keeperAddress:", keeperAddress);

  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedArgs = abiCoder.encode(
    ["string", "uint256", "uint256", "uint256", "uint256", "address"],
    [pair, roundDuration, lockBuffer, minBetAmount, protocolFeeBps, keeperAddress]
  );

  console.log("\n─── ABI Encoded Constructor Arguments (for Blockscout / verification) ───");
  console.log(encodedArgs.slice(2)); // Blockscout takes without 0x or with 0x, but usually without 0x
}

main().catch(console.error);
