/**
 * DotMarket — 100-Round Verification Monitor
 *
 * Reads keeper stdout in real-time, extracts round events,
 * and tracks timing accuracy, revert rate, and cycle health.
 *
 * Run: ts-node verify-100.ts 2>&1 | tee verify-run.log
 * (The keeper is started as a child process by this script)
 */

import * as cp   from 'child_process';
import * as fs   from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// ─── Config ──────────────────────────────────────────────────────────────────

const TARGET_ROUNDS  = 100;
const ROUND_DURATION = 120;   // seconds (from .env)
const LOCK_BUFFER    = 60;    // seconds (from .env)
const TOLERANCE_SECS = 15;    // acceptable drift per phase
const LOG_PATH       = path.join(__dirname, 'verify-run.log');

// ─── Types ───────────────────────────────────────────────────────────────────

interface RoundRecord {
  roundId:      number;
  openedAt:     number;        // wall clock ms
  lockedAt?:    number;
  resolvedAt?:  number;
  openSecs?:    number;        // lockedAt - openedAt (in seconds)
  settleSecs?:  number;        // resolvedAt - lockedAt (in seconds)
  cycleSecs?:   number;        // resolvedAt - openedAt
}

interface VerifyStats {
  passed:          number;
  failed:          number;
  failureReasons:  string[];
  openDrifts:      number[];   // seconds over/under LOCK_BUFFER
  settleDrifts:    number[];
  txReverts:       number;
  stuck:           number;     // rounds that never resolved within 3× expected
  restartRecoveries: number;
}

// ─── State ───────────────────────────────────────────────────────────────────

const rounds: Map<number, RoundRecord> = new Map();
const stats: VerifyStats = {
  passed:            0,
  failed:            0,
  failureReasons:    [],
  openDrifts:        [],
  settleDrifts:      [],
  txReverts:         0,
  stuck:             0,
  restartRecoveries: 0,
};

let totalRoundsCompleted = 0;
let startTime            = Date.now();
let lastRoundId          = -1;
let logStream: fs.WriteStream;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';

function ts() {
  return new Date().toISOString();
}

function log(msg: string) {
  const line = `${DIM}[${ts()}]${RESET} ${msg}`;
  console.log(line);
  if (logStream) logStream.write(line.replace(/\x1b\[[0-9;]*m/g, '') + '\n');
}

function banner(msg: string) {
  const line = `\n${BOLD}${CYAN}${'═'.repeat(60)}${RESET}\n${BOLD}${msg}${RESET}\n${DIM}${'═'.repeat(60)}${RESET}`;
  console.log(line);
  if (logStream) logStream.write(msg + '\n');
}

function formatSecs(s: number) {
  return s >= 0 ? `+${s}s` : `${s}s`;
}

// ─── Log Line Parser ─────────────────────────────────────────────────────────
// Extracts structured events from keeper stdout log lines.

function parseLine(line: string): void {
  const now = Date.now();

  // New round opened
  // "🆕  New round opened! Gas: 82450 Block: 12407"
  if (line.includes('New round opened')) {
    // We don't know the new roundId from this line directly;
    // the round number is inferred from the next "Round #X" pattern
  }

  // "📊  Block #12345 ts=1752000062 | Round #42"
  const roundMatch = line.match(/Round #(\d+)/);
  if (roundMatch) {
    const id = parseInt(roundMatch[1], 10);
    if (id > 0 && !rounds.has(id)) {
      rounds.set(id, { roundId: id, openedAt: now });
      if (id > lastRoundId) {
        lastRoundId = id;
        log(`${GREEN}●${RESET} Round #${id} opened`);
      }
    }
  }

  // "✅  Round #42 locked! Gas: 82450 Block: 12346"
  const lockedMatch = line.match(/Round #(\d+) locked/);
  if (lockedMatch) {
    const id = parseInt(lockedMatch[1], 10);
    const r  = rounds.get(id);
    if (r && !r.lockedAt) {
      r.lockedAt  = now;
      r.openSecs  = Math.round((now - r.openedAt) / 1000);
      log(`${CYAN}🔒${RESET} Round #${id} locked after ${r.openSecs}s (target: ${LOCK_BUFFER}s)`);
    }
  }

  // "✅  Round #42 resolved! Block: 12406"
  const resolvedMatch = line.match(/Round #(\d+) resolved/);
  if (resolvedMatch) {
    const id = parseInt(resolvedMatch[1], 10);
    const r  = rounds.get(id);
    if (r && r.lockedAt && !r.resolvedAt) {
      r.resolvedAt  = now;
      r.settleSecs  = Math.round((now - r.lockedAt) / 1000);
      r.cycleSecs   = Math.round((now - r.openedAt) / 1000);
      evaluateRound(id, r);
    }
  }

  // "restart-recovery" — keeper recovered after restart
  if (line.includes('restart-recovery')) {
    stats.restartRecoveries++;
    log(`⚡ Keeper restart-recovery detected`);
  }

  // Transaction reverts
  if (line.toLowerCase().includes('revert') || line.includes('execution reverted')) {
    stats.txReverts++;
    log(`${RED}⚠️  TX REVERT detected: ${line.trim()}${RESET}`);
  }
}

// ─── Round Evaluator ─────────────────────────────────────────────────────────

function evaluateRound(id: number, r: RoundRecord): void {
  totalRoundsCompleted++;

  const openDrift    = (r.openSecs   ?? 0) - LOCK_BUFFER;
  const settleDrift  = (r.settleSecs ?? 0) - (ROUND_DURATION - LOCK_BUFFER);

  stats.openDrifts.push(openDrift);
  stats.settleDrifts.push(settleDrift);

  const failures: string[] = [];
  if (Math.abs(openDrift)   > TOLERANCE_SECS) failures.push(`OPEN phase drift ${formatSecs(openDrift)} (limit ±${TOLERANCE_SECS}s)`);
  if (Math.abs(settleDrift) > TOLERANCE_SECS) failures.push(`SETTLE phase drift ${formatSecs(settleDrift)} (limit ±${TOLERANCE_SECS}s)`);

  const pass = failures.length === 0;

  if (pass) {
    stats.passed++;
    log(`${GREEN}✅ Round #${id} PASS — OPEN:${r.openSecs}s (+${openDrift}s drift) SETTLE:${r.settleSecs}s (+${settleDrift}s drift) TOTAL:${r.cycleSecs}s${RESET}`);
  } else {
    stats.failed++;
    failures.forEach(f => stats.failureReasons.push(`Round #${id}: ${f}`));
    log(`${RED}❌ Round #${id} FAIL — ${failures.join(', ')}${RESET}`);
  }

  printProgress();

  if (totalRoundsCompleted >= TARGET_ROUNDS) {
    finalReport();
    process.exit(stats.failed === 0 && stats.txReverts === 0 ? 0 : 1);
  }
}

// ─── Progress Display ─────────────────────────────────────────────────────────

function printProgress(): void {
  const pct      = Math.round((totalRoundsCompleted / TARGET_ROUNDS) * 100);
  const elapsed  = Math.round((Date.now() - startTime) / 1000);
  const avgCycle = stats.openDrifts.length > 0
    ? (stats.openDrifts.reduce((a, b) => a + b, 0) / stats.openDrifts.length).toFixed(1)
    : '—';

  const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
  console.log(`\n  ${BOLD}[${bar}] ${pct}% — ${totalRoundsCompleted}/${TARGET_ROUNDS} rounds${RESET}`);
  console.log(`  ${DIM}Elapsed: ${Math.floor(elapsed/60)}m${elapsed%60}s | Passed: ${stats.passed} | Failed: ${stats.failed} | Reverts: ${stats.txReverts} | AvgDrift: ${avgCycle}s${RESET}\n`);
}

// ─── Final Report ─────────────────────────────────────────────────────────────

function finalReport(): void {
  const elapsed   = Math.round((Date.now() - startTime) / 1000);
  const avgOpen   = stats.openDrifts.length   ? (stats.openDrifts.reduce((a,b)=>a+b,0)/stats.openDrifts.length).toFixed(2) : '—';
  const avgSettle = stats.settleDrifts.length ? (stats.settleDrifts.reduce((a,b)=>a+b,0)/stats.settleDrifts.length).toFixed(2) : '—';
  const maxOpen   = stats.openDrifts.length   ? Math.max(...stats.openDrifts.map(Math.abs)) : 0;
  const maxSettle = stats.settleDrifts.length ? Math.max(...stats.settleDrifts.map(Math.abs)) : 0;

  const verdict = stats.failed === 0 && stats.txReverts === 0
    ? `${GREEN}${BOLD}✅  ALL CHECKS PASSED — 100-ROUND VERIFICATION COMPLETE${RESET}`
    : `${RED}${BOLD}❌  VERIFICATION FAILED — ${stats.failed} failed rounds, ${stats.txReverts} tx reverts${RESET}`;

  banner('100-ROUND VERIFICATION FINAL REPORT');
  console.log(verdict);
  console.log(`
  ┌─────────────────────────────────────────────────┐
  │  Total Rounds Completed : ${totalRoundsCompleted.toString().padEnd(22)}│
  │  PASSED                 : ${stats.passed.toString().padEnd(22)}│
  │  FAILED                 : ${stats.failed.toString().padEnd(22)}│
  │  TX Reverts             : ${stats.txReverts.toString().padEnd(22)}│
  │  Restart Recoveries     : ${stats.restartRecoveries.toString().padEnd(22)}│
  ├─────────────────────────────────────────────────┤
  │  OPEN phase avg drift   : ${(avgOpen+'s').padEnd(22)}│
  │  OPEN phase max drift   : ${(maxOpen+'s').padEnd(22)}│
  │  SETTLE phase avg drift : ${(avgSettle+'s').padEnd(22)}│
  │  SETTLE phase max drift : ${(maxSettle+'s').padEnd(22)}│
  │  Total wall-clock time  : ${(Math.floor(elapsed/60)+'m '+elapsed%60+'s').padEnd(22)}│
  └─────────────────────────────────────────────────┘`);

  if (stats.failureReasons.length > 0) {
    console.log(`\n  ${RED}Failures:${RESET}`);
    stats.failureReasons.slice(0, 20).forEach(f => console.log(`    • ${f}`));
  }

  // Save JSON report
  const report = {
    verdict:         stats.failed === 0 && stats.txReverts === 0 ? 'PASS' : 'FAIL',
    timestamp:       new Date().toISOString(),
    totalRounds:     totalRoundsCompleted,
    passed:          stats.passed,
    failed:          stats.failed,
    txReverts:       stats.txReverts,
    restartRecoveries: stats.restartRecoveries,
    avgOpenDriftSecs:   parseFloat(avgOpen as string) || 0,
    avgSettleDriftSecs: parseFloat(avgSettle as string) || 0,
    maxOpenDriftSecs:   maxOpen,
    maxSettleDriftSecs: maxSettle,
    wallClockSecs:   elapsed,
    failureReasons:  stats.failureReasons,
    rounds:          Array.from(rounds.values()).filter(r => r.cycleSecs !== undefined),
  };
  const reportPath = path.join(__dirname, 'verify-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n  ${DIM}Full report: ${reportPath}${RESET}\n`);
}

// ─── Stuck-Round Watchdog ─────────────────────────────────────────────────────

function startStuckWatchdog(): void {
  setInterval(() => {
    const maxAllowedCycleSecs = ROUND_DURATION * 3;
    for (const [id, r] of rounds.entries()) {
      if (r.resolvedAt) continue;  // already done
      const ageSecs = Math.round((Date.now() - r.openedAt) / 1000);
      if (ageSecs > maxAllowedCycleSecs) {
        stats.stuck++;
        log(`${RED}🛑 STUCK: Round #${id} has been open for ${ageSecs}s (limit: ${maxAllowedCycleSecs}s)${RESET}`);
        stats.failureReasons.push(`Round #${id}: STUCK for ${ageSecs}s`);
        // Prevent double-counting
        r.resolvedAt = Date.now();
        stats.failed++;
        totalRoundsCompleted++;
        printProgress();
        if (totalRoundsCompleted >= TARGET_ROUNDS) {
          finalReport();
          process.exit(1);
        }
      }
    }
  }, 10_000);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  logStream = fs.createWriteStream(LOG_PATH, { flags: 'a' });

  banner(`DotMarket 100-Round Verification Monitor`);
  log(`Target: ${TARGET_ROUNDS} rounds | Round: ${ROUND_DURATION}s | Lock: ${LOCK_BUFFER}s | Tolerance: ±${TOLERANCE_SECS}s`);
  log(`Expected wall-clock: ~${Math.round(TARGET_ROUNDS * ROUND_DURATION / 60)}m`);
  log(`Log: ${LOG_PATH}`);

  // Start the keeper as a child process
  log('Starting keeper (npm run dev)…');
  const keeper = cp.spawn('npm', ['run', 'dev'], {
    cwd:   __dirname,
    shell: true,
    env:   { ...process.env },
  });

  // Parse keeper stdout
  const rl = readline.createInterface({ input: keeper.stdout! });
  rl.on('line', (line: string) => {
    // Mirror keeper output
    process.stdout.write(`  ${DIM}keeper>${RESET} ${line}\n`);
    if (logStream) logStream.write(`keeper> ${line}\n`);
    parseLine(line);
  });

  keeper.stderr!.on('data', (data: Buffer) => {
    const text = data.toString();
    process.stderr.write(text);
    if (logStream) logStream.write(`stderr> ${text}`);
    // Check for reverts in stderr too
    if (text.toLowerCase().includes('revert') || text.includes('execution reverted')) {
      stats.txReverts++;
    }
  });

  keeper.on('exit', (code: number | null) => {
    log(`${RED}Keeper process exited with code ${code}${RESET}`);
    if (totalRoundsCompleted < TARGET_ROUNDS) {
      log(`${RED}Keeper exited before ${TARGET_ROUNDS} rounds completed (only ${totalRoundsCompleted} done)${RESET}`);
      finalReport();
      process.exit(1);
    }
  });

  // Graceful shutdown on Ctrl+C
  process.on('SIGINT', () => {
    log('Monitor interrupted — generating partial report…');
    finalReport();
    keeper.kill('SIGTERM');
    process.exit(1);
  });

  startStuckWatchdog();

  log(`${GREEN}Monitor running. Waiting for keeper events…${RESET}`);
}

main().catch(err => {
  console.error('Monitor fatal:', err);
  process.exit(1);
});
