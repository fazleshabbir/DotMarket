"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hermes_client_1 = require("@pythnetwork/hermes-client");
async function main() {
    const hermes = new hermes_client_1.HermesClient("https://hermes.pyth.network");
    const priceFeedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // BTC/USD without 0x
    const updates = await hermes.getLatestPriceUpdates([priceFeedId]);
    const rawData = updates.binary.data[0];
    console.log("Is it Hex? ", /^[0-9a-fA-F]+$/.test(rawData));
    console.log("Raw string length:", rawData.length);
}
main().catch(console.error);
//# sourceMappingURL=test-hermes2.js.map