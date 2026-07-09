const { createPublicClient, http, formatEther } = require('viem');
const client = createPublicClient({
  transport: http('https://5042002.rpc.thirdweb.com')
});

const keeperAddress = '0xfE3194467285B20Db62EBf4Fdda7aADEFEC321ED';

async function run() {
  const balance = await client.getBalance({ address: keeperAddress });
  console.log(`Keeper Address: ${keeperAddress}`);
  console.log(`Keeper Balance: ${formatEther(balance)} USDC/native`);
}
run();
