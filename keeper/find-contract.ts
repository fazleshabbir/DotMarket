import "dotenv/config";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  const rpc = "https://5042002.rpc.thirdweb.com";
  const client = createPublicClient({
    transport: http(rpc),
  });

  const pkey = "901578242d9c94e41fde9a493f08fe21c5ec5012f07342a9643a7194d8a3e14a";
  const account = privateKeyToAccount(`0x${pkey}`);
  console.log("Derived Account Address:", account.address);

  const balance = await client.getBalance({ address: account.address });
  const txCount = await client.getTransactionCount({ address: account.address });
  
  console.log("Account Balance:", balance.toString(), "wei");
  console.log("Account Transaction Count (Nonce):", txCount);
}

main().catch(console.error);
