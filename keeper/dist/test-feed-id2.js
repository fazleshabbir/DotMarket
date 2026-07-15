"use strict";
async function main() {
    const res = await fetch("https://hermes-beta.pyth.network/v2/price_feeds?query=BTC/USD");
    const data = await res.json();
    console.log("Found:", data.length);
    for (let i = 0; i < data.length; i++) {
        console.log(`[${i}] ${data[i].attributes.description}: ${data[i].id}`);
    }
}
main().catch(console.error);
//# sourceMappingURL=test-feed-id2.js.map