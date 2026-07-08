import "dotenv/config";
import { createPublicClient, http } from "viem";

const ROUND_MARKET_ABI = [
  { type: "function", name: "currentRoundId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "keeperAddress", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "paused", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "roundDuration", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "lockBuffer", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "getRound",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "roundId", type: "uint256" },
          { name: "startPrice", type: "int256" },
          { name: "closePrice", type: "int256" },
          { name: "totalUpAmount", type: "uint256" },
          { name: "totalDownAmount", type: "uint256" },
          { name: "startTimestamp", type: "uint256" },
          { name: "lockTimestamp", type: "uint256" },
          { name: "endTimestamp", type: "uint256" },
          { name: "rewardBaseCalAmount", type: "uint256" },
          { name: "rewardAmount", type: "uint256" },
          { name: "resolved", type: "bool" },
          { name: "canceled", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

async function checkAddress(address: string) {
  const client = createPublicClient({
    transport: http("https://5042002.rpc.thirdweb.com")
  });
  
  try {
    const currentRoundId = await client.readContract({
      address: address as `0x${string}`,
      abi: ROUND_MARKET_ABI,
      functionName: "currentRoundId",
    });
    const keeper = await client.readContract({
      address: address as `0x${string}`,
      abi: ROUND_MARKET_ABI,
      functionName: "keeperAddress",
    });
    const owner = await client.readContract({
      address: address as `0x${string}`,
      abi: ROUND_MARKET_ABI,
      functionName: "owner",
    });
    const paused = await client.readContract({
      address: address as `0x${string}`,
      abi: ROUND_MARKET_ABI,
      functionName: "paused",
    });
    const roundDuration = await client.readContract({
      address: address as `0x${string}`,
      abi: ROUND_MARKET_ABI,
      functionName: "roundDuration",
    });
    const lockBuffer = await client.readContract({
      address: address as `0x${string}`,
      abi: ROUND_MARKET_ABI,
      functionName: "lockBuffer",
    });
    console.log(`Address: ${address} | Current Round ID: ${currentRoundId.toString()} | Keeper: ${keeper} | Owner: ${owner} | Paused: ${paused} | Duration: ${roundDuration}s | Buffer: ${lockBuffer}s`);
    
    if (currentRoundId > 0n) {
      const round = await client.readContract({
        address: address as `0x${string}`,
        abi: ROUND_MARKET_ABI,
        functionName: "getRound",
        args: [currentRoundId],
      });
      console.log(`Address: ${address} | Current Round Details:`, {
        roundId: round.roundId.toString(),
        startPrice: round.startPrice.toString(),
        closePrice: round.closePrice.toString(),
        resolved: round.resolved,
        canceled: round.canceled,
      });
    }
  } catch (e: any) {
    console.log(`Address: ${address} failed:`, e.message);
  }
}

async function main() {
  await checkAddress("0x31aeb323aee44e3ee5036f14bbd0d7f1429b4938");
  await checkAddress("0xaa2a723b5aca56e6085c76346c4f54a0b8424837");
}

main().catch(console.error);
