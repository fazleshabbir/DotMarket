"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const viem_1 = require("viem");
const arcTestnet = {
    id: 5042002,
    name: "ARC Testnet",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
};
const PYTH_CONTRACT = "0xACeA761c27A909d4D3895128EBe6370FDE2dF481";
const PYTH_ABI = [
    { type: "function", name: "getUpdateFee", inputs: [{ name: "updateData", type: "bytes[]" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
];
async function main() {
    const publicClient = (0, viem_1.createPublicClient)({ chain: arcTestnet, transport: (0, viem_1.http)() });
    console.log("Calling getUpdateFee with empty array...");
    try {
        const fee = await publicClient.readContract({
            address: PYTH_CONTRACT,
            abi: PYTH_ABI,
            functionName: "getUpdateFee",
            args: [[]],
        });
        console.log("Update Fee for empty:", fee);
    }
    catch (err) {
        console.log("getUpdateFee reverted:", err);
    }
}
main().catch(console.error);
//# sourceMappingURL=test-pyth2.js.map