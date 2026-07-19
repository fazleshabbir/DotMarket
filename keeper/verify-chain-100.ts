import "dotenv/config";
import { createPublicClient, http, type Hex, type Address, type Chain } from "viem";

// ─── ABI with Events ─────────────────────────────────────────────────────────

const ROUND_MARKET_ABI = [
  {
    type: "event", name: "RoundOpened",
    inputs: [
      { name: "roundId",        type: "uint256", indexed: true },
      { name: "startTimestamp", type: "uint256", indexed: false },
      { name: "lockTimestamp",  type: "uint256", indexed: false },
      { name: "endTimestamp",   type: "uint256", indexed: false },
      { name: "startPrice",     type: "int256",  indexed: false }
    ]
  },
  {
    type: "event", name: "RoundLocked",
    inputs: [
      { name: "roundId",   type: "uint256", indexed: true },
      { name: "lockPrice", type: "int256",  indexed: false }
    ]
  },
  {
    type: "event", name: "RoundResolved",
    inputs: [
      { name: "roundId",    type: "uint256", indexed: true },
      { name: "closePrice", type: "int256",  indexed: false },
      { name: "upWins",     type: "bool",    indexed: false }
    ]
  },
  {
    type: "function", name: "currentRoundId",
    inputs: [], outputs: [{ type: "uint256" }],
    stateMutability: "view"
  }
] as const;

// ─── Constants ────────────────────────────────────────────────────────────────

const MARKET_ADDRESS: Address = "0x31Aeb323aEE44e3EE5036F14bBD0D7f1429B4938";
const RPC_URL = process.env.ARC_TESTNET_RPC || "https://5042002.rpc.thirdweb.com" || "https://rpc.testnet.arc.network";

const arcTestnet: Chain = {
  id: 5_042_002,
  name: "ARC Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
};

// ─── Structs ───

interface RoundEventData {
  roundId:          number;
  openedBlock:      number;
  openedTs?:        number;
  expectedLockTs?:  number;
  expectedEndTs?:   number;
  
  lockedBlock?:     number;
  lockedTs?:        number;
  
  resolvedBlock?:   number;
  resolvedTs?:      number;
}

// Helper to delay
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Helper to retry
async function withRetry<T>(label: string, fn: () => Promise<T>, retries = 5): Promise<T> {
  for (let i = 1; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      const delay = 1000 * i;
      console.log(`⚠️  ${label} failed (429/error), retry ${i}/${retries} in ${delay/1000}s...`);
      await sleep(delay);
    }
  }
  throw new Error("retry failed");
}

// ─── Main ───

async function main() {
  console.log("============================================================");
  console.log("         DotMarket On-Chain 100-Round Audit & Verification");
  console.log("============================================================");
  console.log(`  Contract  : ${MARKET_ADDRESS}`);
  console.log(`  RPC       : ${RPC_URL}`);
  console.log("============================================================\n");

  const client = createPublicClient({
    chain: arcTestnet,
    transport: http(RPC_URL, { timeout: 30000 })
  });

  const latestBlock = await client.getBlockNumber();
  console.log(`Latest block: ${latestBlock.toString()}`);

  const currentRoundId = await client.readContract({
    address: MARKET_ADDRESS,
    abi: ROUND_MARKET_ABI,
    functionName: "currentRoundId"
  });
  console.log(`Current Round ID: ${currentRoundId.toString()}\n`);

  // Map to group round events
  const rounds = new Map<number, RoundEventData>();

  // Chunk configuration
  const chunkSize = 1000n;
  let currentToBlock = latestBlock;
  const targetCompletedRounds = 100;

  console.log("Scanning backward for 100 completed rounds...");

  // Keep scanning backward until we have 100 completed rounds or block 0
  while (currentToBlock > 0n) {
    const currentFromBlock = currentToBlock - chunkSize + 1n > 0n ? currentToBlock - chunkSize + 1n : 0n;
    console.log(`  - Scanning block range [${currentFromBlock}..${currentToBlock}]...`);

    try {
      const [openBatch, lockBatch, resolveBatch] = await Promise.all([
        withRetry(`RoundOpened [${currentFromBlock}..${currentToBlock}]`, () =>
          client.getContractEvents({
            address: MARKET_ADDRESS,
            abi: ROUND_MARKET_ABI,
            eventName: "RoundOpened",
            fromBlock: currentFromBlock,
            toBlock: currentToBlock
          })
        ),
        withRetry(`RoundLocked [${currentFromBlock}..${currentToBlock}]`, () =>
          client.getContractEvents({
            address: MARKET_ADDRESS,
            abi: ROUND_MARKET_ABI,
            eventName: "RoundLocked",
            fromBlock: currentFromBlock,
            toBlock: currentToBlock
          })
        ),
        withRetry(`RoundResolved [${currentFromBlock}..${currentToBlock}]`, () =>
          client.getContractEvents({
            address: MARKET_ADDRESS,
            abi: ROUND_MARKET_ABI,
            eventName: "RoundResolved",
            fromBlock: currentFromBlock,
            toBlock: currentToBlock
          })
        )
      ]);

      // Process open logs
      for (const log of openBatch) {
        const roundId = Number(log.args.roundId);
        if (!rounds.has(roundId)) {
          rounds.set(roundId, {
            roundId,
            openedBlock: Number(log.blockNumber),
            expectedLockTs: Number(log.args.lockTimestamp),
            expectedEndTs: Number(log.args.endTimestamp),
          });
        }
      }

      // Process lock logs
      for (const log of lockBatch) {
        const roundId = Number(log.args.roundId);
        const r = rounds.get(roundId);
        if (r) r.lockedBlock = Number(log.blockNumber);
      }

      // Process resolve logs
      for (const log of resolveBatch) {
        const roundId = Number(log.args.roundId);
        const r = rounds.get(roundId);
        if (r) r.resolvedBlock = Number(log.blockNumber);
      }

      // Count completed rounds in window
      const completedCount = Array.from(rounds.values())
        .filter(r => r.openedBlock && r.lockedBlock && r.resolvedBlock).length;

      console.log(`    -> Total completed rounds found so far: ${completedCount}`);

      if (completedCount >= targetCompletedRounds) {
        console.log(`\n🎉 Found ${completedCount} completed rounds! Stopping query scan.`);
        break;
      }

    } catch (err) {
      console.error(`Error fetching logs for range [${currentFromBlock}..${currentToBlock}]:`, err);
    }

    currentToBlock = currentFromBlock - 1n;
    await sleep(250); // Sleep to prevent rate limit triggers
  }

  // Get completed rounds sorted descending (latest first)
  const completedRounds = Array.from(rounds.values())
    .filter(r => r.openedBlock && r.lockedBlock && r.resolvedBlock)
    .sort((a, b) => b.roundId - a.roundId)
    .slice(0, targetCompletedRounds);

  if (completedRounds.length === 0) {
    console.log("❌ Error: No completed rounds found. Cannot audit.");
    return;
  }

  console.log(`Auditing the latest ${completedRounds.length} fully completed rounds...`);

  // Build list of blocks to query
  const blockNumbersToFetch = new Set<number>();
  for (const r of completedRounds) {
    blockNumbersToFetch.add(r.openedBlock);
    if (r.lockedBlock) blockNumbersToFetch.add(r.lockedBlock);
    if (r.resolvedBlock) blockNumbersToFetch.add(r.resolvedBlock);
  }

  console.log(`Fetching timestamps for ${blockNumbersToFetch.size} unique blocks...`);
  const blockTimestamps = new Map<number, number>();

  // Fetch block details sequentially with a small delay to avoid 429
  const blocksArray = Array.from(blockNumbersToFetch);
  for (let i = 0; i < blocksArray.length; i++) {
    const num = blocksArray[i];
    if (i % 10 === 0 && i > 0) {
      console.log(`  - Fetched ${i}/${blocksArray.length} block timestamps...`);
    }
    
    try {
      const b = await withRetry(`BlockTimestamp #${num}`, () =>
        client.getBlock({ blockNumber: BigInt(num) })
      );
      blockTimestamps.set(num, Number(b.timestamp));
    } catch (err) {
      console.error(`Failed to fetch block ${num} after retries:`, err);
    }
    
    await sleep(150); // Robust sequential sleep
  }

  // Map timestamps back to round data
  for (const r of completedRounds) {
    r.openedTs = blockTimestamps.get(r.openedBlock);
    if (r.lockedBlock) r.lockedTs = blockTimestamps.get(r.lockedBlock);
    if (r.resolvedBlock) r.resolvedTs = blockTimestamps.get(r.resolvedBlock);
  }

  // Evaluate timing
  let passed = 0;
  let failed = 0;
  const timingRecords: any[] = [];

  const openDrifts: number[] = [];
  const settleDrifts: number[] = [];

  for (const r of completedRounds) {
    if (!r.openedTs || !r.lockedTs || !r.resolvedTs || !r.expectedLockTs || !r.expectedEndTs) {
      continue;
    }

    const openSecs = r.lockedTs - r.openedTs;
    const settleSecs = r.resolvedTs - r.lockedTs;
    const totalSecs = r.resolvedTs - r.openedTs;

    const expectedOpenSecs = r.expectedLockTs - r.openedTs;
    const expectedSettleSecs = r.expectedEndTs - r.expectedLockTs;

    const openDrift = openSecs - expectedOpenSecs;
    const settleDrift = settleSecs - expectedSettleSecs;

    openDrifts.push(openDrift);
    settleDrifts.push(settleDrift);

    // Tolerance limit is ±15 seconds
    const tolerance = 15;
    const openPass = Math.abs(openDrift) <= tolerance;
    const settlePass = Math.abs(settleDrift) <= tolerance;
    const pass = openPass && settlePass;

    if (pass) {
      passed++;
    } else {
      failed++;
    }

    timingRecords.push({
      roundId: r.roundId,
      openSecs,
      openDrift,
      settleSecs,
      settleDrift,
      totalSecs,
      pass
    });
  }

  const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const maxAbs = (arr: number[]) => arr.length ? Math.max(...arr.map(Math.abs)) : 0;

  console.log("\n============================================================");
  console.log("                  ON-CHAIN AUDIT RESULTS");
  console.log("============================================================");
  console.log(`  Total audited rounds : ${timingRecords.length}`);
  console.log(`  PASSED               : ${passed}`);
  console.log(`  FAILED               : ${failed}`);
  console.log(`  Average OPEN phase drift   : ${avg(openDrifts).toFixed(2)}s`);
  console.log(`  Max OPEN phase drift       : ${maxAbs(openDrifts)}s`);
  console.log(`  Average SETTLE phase drift : ${avg(settleDrifts).toFixed(2)}s`);
  console.log(`  Max SETTLE phase drift     : ${maxAbs(settleDrifts)}s`);
  console.log("============================================================\n");

  if (failed === 0) {
    console.log("✅ VERIFICATION SUCCESS: All audited on-chain rounds have accurate timing within limits!");
  } else {
    console.log("❌ VERIFICATION FAILURE: Some rounds have timing drift exceeding limits.");
  }

  console.log("\nSample Round Timings (Latest 15):");
  console.log("Round | OPEN (s) | OPEN Drift | SETTLE (s) | SETTLE Drift | Result");
  console.log("------|----------|------------|------------|--------------|-------");
  for (const tr of timingRecords.slice(0, 15)) {
    const resIcon = tr.pass ? "✅ PASS" : "❌ FAIL";
    console.log(
      `#${tr.roundId.toString().padEnd(5)}| ` +
      `${tr.openSecs.toString().padEnd(9)}| ` +
      `${(tr.openDrift >= 0 ? "+" : "") + tr.openDrift + "s"}`.padEnd(11) + `| ` +
      `${tr.settleSecs.toString().padEnd(11)}| ` +
      `${(tr.settleDrift >= 0 ? "+" : "") + tr.settleDrift + "s"}`.padEnd(13) + `| ` +
      `${resIcon}`
    );
  }
}

main().catch(err => {
  console.error("Fatal audit error:", err);
});
