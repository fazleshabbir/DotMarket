import { HermesClient } from "@pythnetwork/hermes-client";

async function main() {
  const hermes = new HermesClient("https://hermes.pyth.network");
  const priceFeedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // BTC/USD without 0x
  const updates = await hermes.getLatestPriceUpdates([priceFeedId]);
  
  console.log("Updates:", updates.binary.data[0].substring(0, 50) + "...");
  
  const hexData = updates.binary.data.map((base64Vaa: string) => {
    const hexStr = Buffer.from(base64Vaa, "base64").toString("hex");
    return `0x${hexStr}`;
  });
  
  console.log("Hex Data length:", hexData[0].length);
  console.log("Hex Data start:", hexData[0].substring(0, 50) + "...");
}

main().catch(console.error);
