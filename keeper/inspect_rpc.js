const { createPublicClient, http } = require('viem');

const abi = [
  { type: "function", name: "currentRoundId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "roundDuration", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "lockBuffer", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "getRound",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "roundId", type: "uint256" },
          { name: "startPrice", type: "int256" },
          { name: "closePrice", type: "int256" },
          { name: "totalUpAmount", type: "uint256" },
          { name: "totalDownAmount", type: "uint256" },
          { name: "startTimestamp", type: "uint256" },
          { name: "lockTimestamp", type: "uint256" },
          { name: "endTimestamp", type: "uint256" },
          { name: "rewardBaseCalAmount", type: "uint256" },
          { name: "rewardAmount", type: "uint256" },
          { name: "resolved", type: "bool" },
          { name: "canceled", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
];

const client = createPublicClient({
  transport: http('https://5042002.rpc.thirdweb.com')
});

const marketAddress = '0x31Aeb323aEE44e3EE5036F14bBD0D7f1429B4938';

async function check() {
  const currentRoundId = await client.readContract({
    address: marketAddress,
    abi,
    functionName: 'currentRoundId',
  });
  console.log(`Current Round ID: ${currentRoundId}`);

  for (let i = Math.max(1, Number(currentRoundId) - 10); i <= Number(currentRoundId); i++) {
    const round = await client.readContract({
      address: marketAddress,
      abi,
      functionName: 'getRound',
      args: [BigInt(i)],
    });
    console.log(`Round #${i}:`, JSON.stringify({
      roundId: round.roundId.toString(),
      startPrice: round.startPrice.toString(),
      closePrice: round.closePrice.toString(),
      startTimestamp: round.startTimestamp.toString(),
      lockTimestamp: round.lockTimestamp.toString(),
      endTimestamp: round.endTimestamp.toString(),
      resolved: round.resolved,
      canceled: round.canceled,
      totalUpAmount: round.totalUpAmount.toString(),
      totalDownAmount: round.totalDownAmount.toString(),
    }, null, 2));
  }
}

check().catch(console.error);
