import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0xA801878f362D7c0093Fd96B6616b33812c28ce8E";
  console.log(`Checking contract state at: ${contractAddress}...`);

  // Try thirdweb RPC first, fallback to official RPC
  const rpcUrls = [
    "https://5042002.rpc.thirdweb.com",
    "https://rpc.testnet.arc.network"
  ];

  let provider: any = null;
  for (const url of rpcUrls) {
    try {
      console.log(`Connecting to ${url}...`);
      const p = new ethers.JsonRpcProvider(url);
      await p.getNetwork();
      provider = p;
      console.log(`Connected to ${url}!`);
      break;
    } catch (e) {
      console.warn(`Failed to connect to ${url}:`, e);
    }
  }

  if (!provider) {
    throw new Error("Could not connect to any RPC provider.");
  }

  const abi = [
    "function pair() view returns (string)",
    "function roundDuration() view returns (uint256)",
    "function lockBuffer() view returns (uint256)",
    "function minBetAmount() view returns (uint256)",
    "function protocolFeeBps() view returns (uint256)",
    "function keeperAddress() view returns (address)"
  ];

  const market = new ethers.Contract(contractAddress, abi, provider);

  const pair = await market.pair();
  const roundDuration = await market.roundDuration();
  const lockBuffer = await market.lockBuffer();
  const minBetAmount = await market.minBetAmount();
  const protocolFeeBps = await market.protocolFeeBps();
  const keeperAddress = await market.keeperAddress();

  console.log("\n─── Deployed State Variables ───");
  console.log("pair:", pair);
  console.log("roundDuration:", roundDuration.toString());
  console.log("lockBuffer:", lockBuffer.toString());
  console.log("minBetAmount:", minBetAmount.toString());
  console.log("protocolFeeBps:", protocolFeeBps.toString());
  console.log("keeperAddress:", keeperAddress);

  // Encode constructor args
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedArgs = abiCoder.encode(
    ["string", "uint256", "uint256", "uint256", "uint256", "address"],
    [pair, roundDuration, lockBuffer, minBetAmount, protocolFeeBps, keeperAddress]
  );

  console.log("\n─── ABI Encoded Constructor Arguments (with 0x prefix) ───");
  console.log(encodedArgs);

  console.log("\n─── ABI Encoded Constructor Arguments (without 0x prefix - for Blockscout) ───");
  console.log(encodedArgs.slice(2));
}

main().catch(console.error);
