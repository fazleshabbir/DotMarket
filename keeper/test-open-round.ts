import "dotenv/config";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ROUND_MARKET_ABI = [
  { type: "function", name: "openRound", inputs: [], outputs: [], stateMutability: "nonpayable" },
] as const;

async function main() {
  const rpc = "https://5042002.rpc.thirdweb.com";
  const client = createPublicClient({ transport: http(rpc) });
  
  const pkey = "901578242d9c94e41fde9a493f08fe21c5ec5012f07342a9643a7194d8a3e14a";
  const account = privateKeyToAccount(`0x${pkey}`);
  
  console.log("Derived Address:", account.address);
  
  const wallet = createWalletClient({
    account,
    transport: http(rpc),
  });
  
  try {
    console.log("Simulating openRound call...");
    const { request } = await client.simulateContract({
      address: "0x31Aeb323aEE44e3EE5036F14bBD0D7f1429B4938",
      abi: ROUND_MARKET_ABI,
      functionName: "openRound",
      account,
    });
    console.log("Simulation succeeded! Transaction request is ready.");
  } catch (e: any) {
    console.error("Simulation failed. Reason:", e.message);
  }
}

main().catch(console.error);
