const { createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const abi = [
  {
    type: "function",
    name: "resolveRound",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "closePrice", type: "int256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

const rpc = 'https://5042002.rpc.thirdweb.com';
const privateKey = '0x901578242d9c94e41fde9a493f08fe21c5ec5012f07342a9643a7194d8a3e14a';
const marketAddress = '0x31Aeb323aEE44e3EE5036F14bBD0D7f1429B4938';

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ transport: http(rpc) });

async function simulate() {
  console.log(`Simulating resolveRound for Round 15 from ${account.address}...`);
  try {
    const { request } = await publicClient.simulateContract({
      address: marketAddress,
      abi,
      functionName: 'resolveRound',
      args: [15n, 6200000000000n],
      account,
    });
    console.log("Simulation succeeded!");
  } catch (err) {
    console.error("Simulation failed:", err.message);
  }
}

simulate();
