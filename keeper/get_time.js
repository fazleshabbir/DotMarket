const { createPublicClient, http } = require('viem');
const client = createPublicClient({
  transport: http('https://5042002.rpc.thirdweb.com')
});

async function run() {
  const block = await client.getBlock({ blockTag: 'latest' });
  console.log(`Current Block Timestamp: ${block.timestamp}`);
  console.log(`Current Machine Time (seconds): ${Math.floor(Date.now() / 1000)}`);
}
run();
