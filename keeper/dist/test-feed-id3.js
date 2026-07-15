"use strict";
async function main() {
    const feeds = ["ETH/USD", "SOL/USD"];
    for (const feed of feeds) {
        const res = await fetch(`https://hermes-beta.pyth.network/v2/price_feeds?query=${feed}`);
        const data = await res.json();
        for (const item of data) {
            if (item.attributes.description === `Crypto.${feed}` || item.attributes.description === feed || item.attributes.description === `ETHEREUM / US DOLLAR` || item.attributes.description === `SOLANA / US DOLLAR`) {
                console.log(`${feed}: ${item.id}`);
            }
        }
    }
}
main().catch(console.error);
//# sourceMappingURL=test-feed-id3.js.map