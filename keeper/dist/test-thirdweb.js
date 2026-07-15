"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const viem_1 = require("viem");
async function main() {
    const client = (0, viem_1.createPublicClient)({
        transport: (0, viem_1.http)("https://5042002.rpc.thirdweb.com")
    });
    const block = await client.getBlockNumber();
    console.log("Thirdweb RPC Block Number:", block);
}
main().catch(console.error);
//# sourceMappingURL=test-thirdweb.js.map