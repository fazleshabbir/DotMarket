/**
 * DotMarket — 100-Round Verification Monitor (log-tail mode)
 * 
 * Tails the keeper background task log file and tracks all round events.
 * Does NOT spawn the keeper — just reads its output from the log.
 * 
 * Run: npx ts-node verify-monitor.ts <log-file-path>
 */

import * as fs   from 'fs';
import * as path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const TARGET_ROUNDS  = 100;
const ROUND_DURATION = 120;
const LOCK_BUFFER    = 60;
const TOLERANCE_SECS = 15;

const LOG_FILE = process.argv[2] || path.join(
  'C:\\Users\\fazle\\.gemini\\antigravity\\brain\\81c63d75-d442-46dc-a1e7-bf54ee4a5aba\\.system_generated\\tasks',
  'task-11544.log'
);
const REPORT_PATH    = path.join(__dirname, 'verify-report.json');
const SUMMARY_PATH   = path.join(__dirname, 'verify-summary.md');

// ─── Types ───────────────────────────────────────────────────────────────────

interface RoundRecord {
  roundId:     number;
  seenAt:      number;
  lockedAt?:   number;
  resolvedAt?: number;
  openedNextAt?: number;
  openSecs?:   number;
  settleSecs?: number;
  cycleSecs?:  number;
  pass?:       boolean;
  failures:    string[];
}

// ─── State ───────────────────────────────────────────────────────────────────

const rounds      = new Map<number, RoundRecord>();
let txReverts     = 0;
let restarts      = 0;
let totalComplete = 0;
let startedAt     = Date.now();
let prevRoundId   = -1;
let finished      = false;
let fileOffset    = 0;

// ─── Parser ──────────────────────────────────────────────────────────────────

function parseLine(line: string): void {
  if (!line.trim()) return;

  const now = Date.now();

  // "Block #X ts=Y | Round #Z"  → register round as seen
  const blockMatch = line.match(/Block #\d+ ts=\d+ \| Round #(\d+)/);
  if (blockMatch) {
    const id = parseInt(blockMatch[1], 10);
    if (id > 0 && !rounds.has(id)) {
      rounds.set(id, { roundId: id, seenAt: now, failures: [] });
    }
    if (id > prevRoundId) prevRoundId = id;
    return;
  }

  // "Round #X locked"
  const lockedMatch = line.match(/Round #(\d+) locked/);
  if (lockedMatch) {
    const id = parseInt(lockedMatch[1], 10);
    const r  = rounds.get(id);
    if (r && !r.lockedAt) {
      r.lockedAt = now;
      r.openSecs = Math.round((now - r.seenAt) / 1000);
      printLine(`🔒 Round #${id} locked — OPEN phase: ${r.openSecs}s (target ${LOCK_BUFFER}s, drift ${r.openSecs - LOCK_BUFFER}s)`);
    }
    return;
  }

  // "Round #X resolved"
  const resolvedMatch = line.match(/Round #(\d+) resolved/);
  if (resolvedMatch) {
    const id = parseInt(resolvedMatch[1], 10);
    const r  = rounds.get(id);
    if (r && r.lockedAt && !r.resolvedAt) {
      r.resolvedAt = now;
      r.settleSecs  = Math.round((now - r.lockedAt) / 1000);
      r.cycleSecs   = Math.round((now - r.seenAt)   / 1000);
      evaluateRound(id, r);
    }
    return;
  }

  // New round opened
  if (line.includes('New round opened') || line.includes('new round opened')) {
    printLine(`🆕 New round opened`);
    return;
  }

  // Restart recovery
  if (line.includes('restart-recovery')) {
    restarts++;
    printLine(`⚡ restart-recovery #${restarts}`);
    return;
  }

  // Revert
  if (line.toLowerCase().includes('revert') || line.includes('execution reverted')) {
    txReverts++;
    printLine(`❌ TX REVERT: ${line.trim().substring(0, 120)}`);
  }
}

// ─── Round Evaluator ─────────────────────────────────────────────────────────

function evaluateRound(id: number, r: RoundRecord): void {
  totalComplete++;

  const openDrift   = (r.openSecs   ?? 0) - LOCK_BUFFER;
  const settleDrift = (r.settleSecs ?? 0) - (ROUND_DURATION - LOCK_BUFFER);

  if (Math.abs(openDrift)   > TOLERANCE_SECS) r.failures.push(`OPEN drift ${openDrift > 0 ? '+' : ''}${openDrift}s`);
  if (Math.abs(settleDrift) > TOLERANCE_SECS) r.failures.push(`SETTLE drift ${settleDrift > 0 ? '+' : ''}${settleDrift}s`);

  r.pass = r.failures.length === 0;

  const icon = r.pass ? '✅' : '❌';
  printLine(`${icon} Round #${id} — OPEN:${r.openSecs}s SETTLE:${r.settleSecs}s TOTAL:${r.cycleSecs}s${r.failures.length ? ' FAIL: ' + r.failures.join(', ') : ' PASS'}`);

  printProgress();

  if (totalComplete >= TARGET_ROUNDS && !finished) {
    finished = true;
    finalReport();
    process.exit(
      (Array.from(rounds.values()).filter(r => !r.pass && r.cycleSecs !== undefined).length === 0 && txReverts === 0)
        ? 0 : 1
    );
  }
}

// ─── Display ─────────────────────────────────────────────────────────────────

function printLine(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function printProgress(): void {
  const completed = Array.from(rounds.values()).filter(r => r.cycleSecs !== undefined);
  const passed    = completed.filter(r => r.pass).length;
  const failed    = completed.filter(r => !r.pass).length;
  const pct       = Math.round((totalComplete / TARGET_ROUNDS) * 100);
  const elapsed   = Math.round((Date.now() - startedAt) / 1000);

  const bar = '█'.repeat(Math.floor(pct / 5)).padEnd(20, '░');
  console.log(`\n  [${bar}] ${pct}% — ${totalComplete}/${TARGET_ROUNDS} | ✅ ${passed} ❌ ${failed} | TX Reverts: ${txReverts} | ${Math.floor(elapsed/60)}m${elapsed%60}s elapsed\n`);
}

// ─── Final Report ─────────────────────────────────────────────────────────────

function finalReport(): void {
  const completed = Array.from(rounds.values()).filter(r => r.cycleSecs !== undefined);
  const passed    = completed.filter(r => r.pass);
  const failed    = completed.filter(r => !r.pass);

  const openDrifts   = completed.map(r => (r.openSecs   ?? LOCK_BUFFER) - LOCK_BUFFER);
  const settleDrifts = completed.map(r => (r.settleSecs ?? (ROUND_DURATION - LOCK_BUFFER)) - (ROUND_DURATION - LOCK_BUFFER));

  const avg = (arr: number[]) => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
  const maxAbs = (arr: number[]) => arr.length ? Math.max(...arr.map(Math.abs)) : 0;

  const verdict = failed.length === 0 && txReverts === 0 ? 'PASS' : 'FAIL';
  const elapsed = Math.round((Date.now() - startedAt) / 1000);

  console.log('\n' + '═'.repeat(60));
  console.log(`  ${verdict === 'PASS' ? '✅' : '❌'}  100-ROUND VERIFICATION — ${verdict}`);
  console.log('═'.repeat(60));
  console.log(`
  Rounds completed    : ${totalComplete}
  Passed              : ${passed.length}
  Failed              : ${failed.length}
  TX Reverts          : ${txReverts}
  Restart recoveries  : ${restarts}
  
  OPEN  avg drift     : ${avg(openDrifts).toFixed(1)}s
  OPEN  max drift     : ${maxAbs(openDrifts)}s
  SETTLE avg drift    : ${avg(settleDrifts).toFixed(1)}s
  SETTLE max drift    : ${maxAbs(settleDrifts)}s
  
  Wall-clock time     : ${Math.floor(elapsed/60)}m ${elapsed%60}s
  `);

  if (failed.length > 0) {
    console.log('  Failed rounds:');
    failed.forEach(r => console.log(`    Round #${r.roundId}: ${r.failures.join(', ')}`));
  }

  // JSON report
  const report = {
    verdict, timestamp: new Date().toISOString(), totalRounds: totalComplete,
    passed: passed.length, failed: failed.length, txReverts, restarts,
    avgOpenDrift: parseFloat(avg(openDrifts).toFixed(2)),
    avgSettleDrift: parseFloat(avg(settleDrifts).toFixed(2)),
    maxOpenDrift: maxAbs(openDrifts), maxSettleDrift: maxAbs(settleDrifts),
    wallClockSecs: elapsed,
    rounds: completed.map(r => ({
      roundId: r.roundId, openSecs: r.openSecs, settleSecs: r.settleSecs,
      cycleSecs: r.cycleSecs, pass: r.pass, failures: r.failures
    }))
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  // Markdown summary
  const md = [
    `# DotMarket 100-Round Verification Report`,
    ``,
    `**Verdict: ${verdict}** | ${new Date().toISOString()}`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Rounds completed | ${totalComplete} |`,
    `| Passed | ${passed.length} |`,
    `| Failed | ${failed.length} |`,
    `| TX Reverts | ${txReverts} |`,
    `| Restart recoveries | ${restarts} |`,
    `| Avg OPEN drift | ${avg(openDrifts).toFixed(1)}s |`,
    `| Max OPEN drift | ${maxAbs(openDrifts)}s |`,
    `| Avg SETTLE drift | ${avg(settleDrifts).toFixed(1)}s |`,
    `| Max SETTLE drift | ${maxAbs(settleDrifts)}s |`,
    `| Wall-clock | ${Math.floor(elapsed/60)}m ${elapsed%60}s |`,
    ``,
    failed.length > 0 ? `## Failed Rounds\n${failed.map(r => `- Round #${r.roundId}: ${r.failures.join(', ')}`).join('\n')}` : `## All rounds passed ✅`,
    ``,
    `## Round-by-round`,
    `| Round | OPEN (s) | SETTLE (s) | TOTAL (s) | Pass |`,
    `|-------|----------|------------|-----------|------|`,
    ...completed.map(r => `| #${r.roundId} | ${r.openSecs} | ${r.settleSecs} | ${r.cycleSecs} | ${r.pass ? '✅' : '❌'} |`)
  ].join('\n');
  fs.writeFileSync(SUMMARY_PATH, md, 'utf8');

  console.log(`\n  Reports:\n    ${REPORT_PATH}\n    ${SUMMARY_PATH}\n`);
}

// ─── Log Tail ─────────────────────────────────────────────────────────────────
// Reads the keeper log file incrementally, buffering partial lines.

let partialLine = '';

function readNewLines(): void {
  try {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size <= fileOffset) return;

    const buf  = Buffer.alloc(stat.size - fileOffset);
    const fd   = fs.openSync(LOG_FILE, 'r');
    fs.readSync(fd, buf, 0, buf.length, fileOffset);
    fs.closeSync(fd);
    fileOffset = stat.size;

    const text   = partialLine + buf.toString('utf8');
    const lines  = text.split('\n');
    partialLine  = lines.pop() ?? '';   // last item may be incomplete

    for (const line of lines) {
      parseLine(line);
    }
  } catch {
    // File may not exist yet — keep trying
  }
}

// ─── Stuck Watchdog ───────────────────────────────────────────────────────────

function checkStuck(): void {
  const maxSecs = ROUND_DURATION * 3;
  for (const [id, r] of rounds.entries()) {
    if (r.resolvedAt || r.cycleSecs !== undefined) continue;
    const ageSecs = Math.round((Date.now() - r.seenAt) / 1000);
    if (ageSecs > maxSecs) {
      r.failures.push(`STUCK ${ageSecs}s`);
      r.pass       = false;
      r.cycleSecs  = ageSecs;
      totalComplete++;
      printLine(`🛑 Round #${id} STUCK for ${ageSecs}s — counting as failure`);
      printProgress();
      if (totalComplete >= TARGET_ROUNDS && !finished) {
        finished = true;
        finalReport();
        process.exit(1);
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(60)}`);
console.log(`  DotMarket 100-Round Verification Monitor`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Log file  : ${LOG_FILE}`);
console.log(`  Target    : ${TARGET_ROUNDS} rounds`);
console.log(`  Tolerance : ±${TOLERANCE_SECS}s per phase`);
console.log(`  Est. time : ~${Math.round(TARGET_ROUNDS * ROUND_DURATION / 60)}m`);
console.log(`${'═'.repeat(60)}\n`);

// Check file exists
if (!fs.existsSync(LOG_FILE)) {
  console.error(`Log file not found: ${LOG_FILE}`);
  process.exit(1);
}

// Start from beginning of file to catch rounds already in progress
fileOffset = 0;
startedAt  = Date.now();

// Poll every 2 seconds for new log lines
setInterval(readNewLines, 2_000);
setInterval(checkStuck,   15_000);

// Read immediately on start
readNewLines();
