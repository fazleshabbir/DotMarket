import type { HealthSnapshot, Alert, AIAnalysis, RecoveryAction } from './types';
import { logEvent } from './logger';

// ── AI Decision Engine ──────────────────────────────────────────────────────
// Phase 3: Feed health snapshots to Gemini for intelligent diagnosis.
// Falls back to deterministic analysis if AI is unavailable.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Rate limiting: max 1 AI call per 15 seconds
let lastAICall = 0;
const AI_COOLDOWN_MS = 15_000;

const SYSTEM_PROMPT = `You are the Protocol Guardian AI for DotMarket, a decentralized prediction market on ARC blockchain.
Your job is to analyze protocol health snapshots and recommend safe recovery actions.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation outside JSON.

Response format:
{
  "overallHealth": "healthy" | "warning" | "degraded" | "critical",
  "rootCause": "Brief 1-sentence root cause",
  "confidence": 0-100,
  "recommendedActions": [
    {
      "action": "RESTART_KEEPER" | "SWITCH_RPC" | "RETRY_SETTLEMENT" | "PAUSE_MARKETS" | "RESUME_MARKETS" | "CLEAR_QUEUE" | "NOTIFY_ADMIN",
      "priority": 1,
      "reasoning": "Why this action"
    }
  ],
  "summary": "1-2 sentence summary of the situation"
}

Available actions and what they do:
- RESTART_KEEPER: Resets the keeper's internal state and resumes the market loop
- SWITCH_RPC: Rotates to the next backup RPC endpoint
- RETRY_SETTLEMENT: Attempts to resolve the current stuck round
- PAUSE_MARKETS: Stops creating new market rounds
- RESUME_MARKETS: Resumes creating new market rounds
- CLEAR_QUEUE: Clears failed transaction queue
- NOTIFY_ADMIN: Sends alert to admin via Discord/Telegram

Rules:
- Always prioritize safety — never recommend actions that could lose user funds
- If keeper is offline, RESTART_KEEPER should be priority 1
- If RPC is slow, SWITCH_RPC before RESTART_KEEPER
- If settlement is stuck, RETRY_SETTLEMENT before RESTART_KEEPER
- If multiple issues, recommend actions in execution order
- Maximum 4 recommended actions`;

/** Build the analysis prompt from health snapshot and alerts */
function buildPrompt(snapshot: HealthSnapshot, alerts: Alert[]): string {
  const alertSummary = alerts.length > 0
    ? alerts.map(a => `  - [${a.severity.toUpperCase()}] ${a.rule}: ${a.message}`).join('\n')
    : '  None';

  return `Current protocol health state:

Market ID: #${snapshot.marketId}
Phase: ${snapshot.phase}
Timer: ${snapshot.timer}s ${snapshot.timer < 0 ? '(OVERDUE)' : ''}
Keeper: ${snapshot.keeperAlive ? 'Running' : 'OFFLINE'}
Keeper Uptime: ${snapshot.keeperUptime}s
RPC Latency: ${snapshot.rpcLatency}ms
RPC Endpoint: ${snapshot.rpcEndpoint}
Oracle: ${snapshot.oracleFresh ? 'Fresh' : 'STALE'} (last update ${snapshot.oracleLastUpdate}ms ago)
Pending Tx: ${snapshot.pendingTx}
Failed Tx: ${snapshot.failedTx}
Last Settlement: ${snapshot.lastSettlement}
Memory: ${snapshot.memoryUsage}%
CPU: ${snapshot.cpuUsage}%
Balance: ${snapshot.keeperBalance} ETH

Active Alerts:
${alertSummary}

Analyze the situation and recommend recovery actions.`;
}

/** Call Gemini API for analysis */
async function callGemini(prompt: string): Promise<AIAnalysis | null> {
  if (!GEMINI_API_KEY) {
    logEvent('AI_SKIP', 'No GEMINI_API_KEY configured — using deterministic analysis', 'warning');
    return null;
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errText = await response.text();
      logEvent('AI_ERROR', `Gemini API error: ${response.status} — ${errText.substring(0, 200)}`, 'warning');
      return null;
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      logEvent('AI_ERROR', 'Gemini returned empty response', 'warning');
      return null;
    }

    // Parse the JSON response
    const parsed = JSON.parse(text);
    const analysis: AIAnalysis = {
      overallHealth: parsed.overallHealth || 'critical',
      rootCause: parsed.rootCause || 'Unknown',
      confidence: parsed.confidence || 50,
      recommendedActions: (parsed.recommendedActions || []).map((a: any) => ({
        action: a.action as RecoveryAction,
        priority: a.priority || 1,
        reasoning: a.reasoning || '',
      })),
      summary: parsed.summary || '',
      timestamp: Date.now(),
    };

    logEvent('AI_DIAGNOSIS', `AI analysis: ${analysis.overallHealth} — ${analysis.rootCause}`, analysis.overallHealth);
    return analysis;

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent('AI_ERROR', `Gemini call failed: ${msg}`, 'warning');
    return null;
  }
}

/** Deterministic fallback when AI is unavailable */
function deterministicAnalysis(snapshot: HealthSnapshot, alerts: Alert[]): AIAnalysis {
  const actions: AIAnalysis['recommendedActions'] = [];
  let rootCause = 'System operating normally';
  let priority = 1;

  // Keeper offline → restart
  if (!snapshot.keeperAlive) {
    rootCause = 'Keeper process is offline or unresponsive';
    actions.push({ action: 'RESTART_KEEPER', priority: priority++, reasoning: 'Keeper heartbeat lost' });
  }

  // RPC issues → switch
  if (snapshot.rpcLatency > 800) {
    rootCause = rootCause === 'System operating normally' ? 'RPC endpoint degraded' : rootCause;
    actions.push({ action: 'SWITCH_RPC', priority: priority++, reasoning: `Latency ${snapshot.rpcLatency}ms exceeds threshold` });
  }

  // Settlement stuck → retry
  if (snapshot.phase === 'SETTLING' && snapshot.timer < -30) {
    rootCause = rootCause === 'System operating normally' ? 'Settlement delayed past deadline' : rootCause;
    actions.push({ action: 'RETRY_SETTLEMENT', priority: priority++, reasoning: `Settlement ${Math.abs(snapshot.timer)}s overdue` });
  }

  // Oracle stale → notify
  if (!snapshot.oracleFresh) {
    actions.push({ action: 'NOTIFY_ADMIN', priority: priority++, reasoning: 'Oracle price feed stale' });
  }

  // Always notify on critical
  if (snapshot.overallHealth === 'critical' && !actions.find(a => a.action === 'NOTIFY_ADMIN')) {
    actions.push({ action: 'NOTIFY_ADMIN', priority: priority++, reasoning: 'Critical health status detected' });
  }

  return {
    overallHealth: snapshot.overallHealth,
    rootCause,
    confidence: 85,
    recommendedActions: actions,
    summary: actions.length > 0
      ? `Detected ${alerts.length} alert(s). Primary issue: ${rootCause}.`
      : 'All systems operating within normal parameters.',
    timestamp: Date.now(),
  };
}

/** Main analysis entry point — tries AI first, falls back to deterministic */
export async function analyzeHealth(
  snapshot: HealthSnapshot,
  alerts: Alert[]
): Promise<AIAnalysis> {
  const now = Date.now();

  // Rate limiting
  if (now - lastAICall < AI_COOLDOWN_MS) {
    return deterministicAnalysis(snapshot, alerts);
  }

  // Only call AI for non-healthy states (save quota)
  if (snapshot.overallHealth === 'healthy') {
    return deterministicAnalysis(snapshot, alerts);
  }

  lastAICall = now;
  const prompt = buildPrompt(snapshot, alerts);
  const aiResult = await callGemini(prompt);

  if (aiResult) {
    return aiResult;
  }

  // Fallback
  return deterministicAnalysis(snapshot, alerts);
}
