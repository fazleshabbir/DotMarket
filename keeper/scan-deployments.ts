import { createPublicClient, http, getContractAddress } from "viem";

const ROUND_MARKET_ABI = [
  { type: "function", name: "currentRoundId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

async function main() {
  const rpc = "https://5042002.rpc.thirdweb.com";
  const client = createPublicClient({
    transport: http(rpc),
  });

  const deployer = "0xfE3194467285B20Db62EBf4Fdda7aADEFEC321ED";
  console.log("Scanning contracts deployed by:", deployer);

  // Scan recent nonces (e.g. from 0 to 155)
  for (let nonce = 0n; nonce < 160n; nonce++) {
    const contractAddress = getContractAddress({
      from: deployer as `0x${string}`,
      nonce,
    });

    try {
      // Check if address has code
      const code = await client.getBytecode({ address: contractAddress });
      if (code && code !== "0x") {
        // Read currentRoundId
        const currentRoundId = await client.readContract({
          address: contractAddress,
          abi: ROUND_MARKET_ABI,
          functionName: "currentRoundId",
        });
        console.log(`Nonce: ${nonce} | Address: ${contractAddress} | Current Round ID: ${currentRoundId}`);
      }
    } catch (e) {
      // Not our contract or error
    }
  }
  console.log("Scan finished.");
}

main().catch(console.error);
