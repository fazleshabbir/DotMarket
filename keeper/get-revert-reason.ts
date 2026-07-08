import "dotenv/config";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ROUND_MARKET_ABI = [
  { type: "function", name: "openRound", inputs: [], outputs: [], stateMutability: "nonpayable" },
] as const;

async function main() {
  const rpc = "https://5042002.rpc.thirdweb.com";
  const client = createPublicClient({ transport: http(rpc) });
  
  const pkey = "901578242d9c94e41fde9a493f08fe21c5ec5012f07342a9643a7194d8a3e14a";
  const account = privateKeyToAccount(`0x${pkey}`);
  
  try {
    await client.simulateContract({
      address: "0xaa2a723b5aca56e6085c76346c4f54a0b8424837",
      abi: ROUND_MARKET_ABI,
      functionName: "openRound",
      account,
    });
  } catch (e: any) {
    console.log("Full Error Name:", e.name);
    console.log("Full Error Message:", e.message);
    if (e.cause) {
      console.log("Error Cause Name:", e.cause.name);
      console.log("Error Cause Message:", e.cause.message);
      if (e.cause.cause) {
        console.log("Nested Error Cause Message:", e.cause.cause.message);
      }
    }
  }
}

main().catch(console.error);
