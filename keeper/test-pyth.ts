import { createPublicClient, http, type Hex, type Address, type Chain } from "viem";
import { HermesClient } from "@pythnetwork/hermes-client";

const arcTestnet: Chain = {
  id: 5_042_002,
  name: "ARC Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
};

const PYTH_CONTRACT: Address = "0xACeA761c27A909d4D3895128EBe6370FDE2dF481";
const PYTH_ABI = [
  { type: "function", name: "getUpdateFee", inputs: [{ name: "updateData", type: "bytes[]" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getValidTimePeriod", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

async function main() {
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });

  try {
    const validTime = await publicClient.readContract({
      address: PYTH_CONTRACT,
      abi: PYTH_ABI,
      functionName: "getValidTimePeriod"
    });
    console.log("Pyth Contract Valid Time Period:", validTime);
  } catch (err) {
    console.log("Failed to read getValidTimePeriod - is this a Pyth contract?", err);
  }

  const hermes = new HermesClient("https://hermes-beta.pyth.network");
  const priceFeedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // BTC/USD

  console.log("Fetching VAA from hermes-beta...");
  const updates = await hermes.getLatestPriceUpdates([priceFeedId]);
  
  const hexData = updates.binary.data.map((hexVaa: string) => `0x${hexVaa}` as Hex);
  
  console.log("Calling getUpdateFee...");
  try {
    const fee = await publicClient.readContract({
      address: PYTH_CONTRACT,
      abi: PYTH_ABI,
      functionName: "getUpdateFee",
      args: [hexData],
    });
    console.log("Update Fee:", fee);
  } catch (err) {
    console.log("getUpdateFee reverted:", err);
  }
}

main().catch(console.error);
