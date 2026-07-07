async function main() {
  const res = await fetch("https://hermes-beta.pyth.network/v2/price_feeds?query=BTC/USD");
  const data = await res.json() as any[];
  console.log("BTC/USD Testnet ID:", data[0]?.id);
}
main().catch(console.error);
