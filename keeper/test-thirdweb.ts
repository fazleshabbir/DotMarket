import { createPublicClient, http } from "viem";

async function main() {
  const client = createPublicClient({
    transport: http("https://5042002.rpc.thirdweb.com")
  });
  const block = await client.getBlockNumber();
  console.log("Thirdweb RPC Block Number:", block);
}
main().catch(console.error);
