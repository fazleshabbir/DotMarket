"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const viem_1 = require("viem");
const hermes_client_1 = require("@pythnetwork/hermes-client");
const arcTestnet = {
    id: 5042002,
    name: "ARC Testnet",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
};
const PYTH_CONTRACT = "0xACeA761c27A909d4D3895128EBe6370FDE2dF481";
const PYTH_ABI = [
    { type: "function", name: "getUpdateFee", inputs: [{ name: "updateData", type: "bytes[]" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
    { type: "function", name: "getValidTimePeriod", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
];
async function main() {
    const publicClient = (0, viem_1.createPublicClient)({ chain: arcTestnet, transport: (0, viem_1.http)() });
    try {
        const validTime = await publicClient.readContract({
            address: PYTH_CONTRACT,
            abi: PYTH_ABI,
            functionName: "getValidTimePeriod"
        });
        console.log("Pyth Contract Valid Time Period:", validTime);
    }
    catch (err) {
        console.log("Failed to read getValidTimePeriod - is this a Pyth contract?", err);
    }
    const hermes = new hermes_client_1.HermesClient("https://hermes-beta.pyth.network");
    const priceFeedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // BTC/USD
    console.log("Fetching VAA from hermes-beta...");
    const updates = await hermes.getLatestPriceUpdates([priceFeedId]);
    const hexData = updates.binary.data.map((hexVaa) => `0x${hexVaa}`);
    console.log("Calling getUpdateFee...");
    try {
        const fee = await publicClient.readContract({
            address: PYTH_CONTRACT,
            abi: PYTH_ABI,
            functionName: "getUpdateFee",
            args: [hexData],
        });
        console.log("Update Fee:", fee);
    }
    catch (err) {
        console.log("getUpdateFee reverted:", err);
    }
}
main().catch(console.error);
//# sourceMappingURL=test-pyth.js.map