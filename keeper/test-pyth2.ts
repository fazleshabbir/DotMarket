import { createPublicClient, http, type Hex, type Address, type Chain } from "viem";

const arcTestnet: Chain = {
  id: 5_042_002,
  name: "ARC Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
};

const PYTH_CONTRACT: Address = "0xACeA761c27A909d4D3895128EBe6370FDE2dF481";
const PYTH_ABI = [
  { type: "function", name: "getUpdateFee", inputs: [{ name: "updateData", type: "bytes[]" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

async function main() {
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });

  console.log("Calling getUpdateFee with empty array...");
  try {
    const fee = await publicClient.readContract({
      address: PYTH_CONTRACT,
      abi: PYTH_ABI,
      functionName: "getUpdateFee",
      args: [[]],
    });
    console.log("Update Fee for empty:", fee);
  } catch (err) {
    console.log("getUpdateFee reverted:", err);
  }
}

main().catch(console.error);
