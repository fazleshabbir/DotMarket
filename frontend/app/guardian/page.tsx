'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { ConnectButton } from '@/components/ConnectButton';

// ── Types ──────────────────────────────────────────────────────────────────

type Severity = 'healthy' | 'warning' | 'degraded' | 'critical';

interface HealthSnapshot {
  timestamp: number;
  marketId: number;
  phase: string;
  timer: number;
  keeperAlive: boolean;
  keeperUptime: number;
  oracleFresh: boolean;
  oracleLastUpdate: number;
  rpcLatency: number;
  rpcEndpoint: string;
  pendingTx: number;
  failedTx: number;
  lastSettlement: string;
  memoryUsage: number;
  cpuUsage: number;
  keeperBalance: string;
  overallHealth: Severity;
}

interface Alert {
  id: string;
  rule: string;
  severity: Severity;
  message: string;
  timestamp: number;
}

interface AIAnalysis {
  overallHealth: Severity;
  rootCause: string;
  confidence: number;
  recommendedActions: {
    action: string;
    priority: number;
    reasoning: string;
  }[];
  summary: string;
  timestamp: number;
}

interface LogEvent {
  id: string;
  type: string;
  message: string;
  severity: Severity;
  timestamp: number;
}

interface RecoveryResult {
  success: boolean;
  action: string;
  message: string;
  duration: number;
  timestamp: number;
}

interface GuardianStatus {
  health: HealthSnapshot | null;
  alerts: Alert[];
  aiAnalysis: AIAnalysis | null;
  logs: LogEvent[];
  recoveries: RecoveryResult[];
}

// ── Config ─────────────────────────────────────────────────────────────────

const GUARDIAN_API = process.env.NEXT_PUBLIC_GUARDIAN_URL || 'http://localhost:10000';
const POLL_INTERVAL = 3000;

// ── Helpers ────────────────────────────────────────────────────────────────

const severityColor: Record<Severity, string> = {
  healthy: '#00ff88',
  warning: '#ffaa00',
  degraded: '#ff6600',
  critical: '#ff2244',
};

const severityIcon: Record<Severity, string> = {
  healthy: '🟢',
  warning: '🟡',
  degraded: '🟠',
  critical: '🔴',
};

const severityBg: Record<Severity, string> = {
  healthy: 'rgba(0, 255, 136, 0.06)',
  warning: 'rgba(255, 170, 0, 0.06)',
  degraded: 'rgba(255, 102, 0, 0.06)',
  critical: 'rgba(255, 34, 68, 0.06)',
};

const severityBorder: Record<Severity, string> = {
  healthy: 'rgba(0, 255, 136, 0.2)',
  warning: 'rgba(255, 170, 0, 0.2)',
  degraded: 'rgba(255, 102, 0, 0.2)',
  critical: 'rgba(255, 34, 68, 0.2)',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

// ── Components ─────────────────────────────────────────────────────────────

function StatusCard({ label, value, severity, subtitle }: {
  label: string;
  value: string | number;
  severity: Severity;
  subtitle?: string;
}) {
  return (
    <div style={{
      background: severityBg[severity],
      border: `1px solid ${severityBorder[severity]}`,
      borderRadius: 14,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'all 300ms ease',
    }}>
      <span style={{
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>{label}</span>
      <span style={{
        fontSize: 28,
        fontWeight: 700,
        fontFamily: "'Inter', sans-serif",
        color: severityColor[severity],
        letterSpacing: '-0.5px',
      }}>{value}</span>
      {subtitle && (
        <span style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>{subtitle}</span>
      )}
    </div>
  );
}

function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {alerts.map(alert => (
        <div key={alert.id} style={{
          background: severityBg[alert.severity],
          border: `1px solid ${severityBorder[alert.severity]}`,
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>{severityIcon[alert.severity]}</span>
          <span style={{
            fontSize: 13,
            color: severityColor[alert.severity],
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
          }}>{alert.rule.toUpperCase()}</span>
          <span style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
            flex: 1,
          }}>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}

function AIPanel({ analysis }: { analysis: AIAnalysis | null }) {
  if (!analysis) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 24,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
        <div style={{ fontSize: 14 }}>AI Analysis Idle</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Activates when issues are detected</div>
      </div>
    );
  }

  return (
    <div style={{
      background: severityBg[analysis.overallHealth],
      border: `1px solid ${severityBorder[analysis.overallHealth]}`,
      borderRadius: 14,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🧠</span>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            color: severityColor[analysis.overallHealth],
          }}>AI Diagnosis</span>
        </div>
        <span style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(255,255,255,0.4)',
        }}>Confidence: {analysis.confidence}%</span>
      </div>

      <div style={{
        fontSize: 14,
        color: '#ffffff',
        fontWeight: 600,
      }}>Root Cause: {analysis.rootCause}</div>

      <div style={{
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 1.5,
      }}>{analysis.summary}</div>

      {analysis.recommendedActions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>Recommended Actions</span>
          {analysis.recommendedActions
            .sort((a, b) => a.priority - b.priority)
            .map((action, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}>{action.priority}</span>
              <span style={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: '#ffffff',
              }}>{action.action}</span>
              <span style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                flex: 1,
              }}>{action.reasoning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventLog({ logs }: { logs: LogEvent[] }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>📋</span>
        <span style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#ffffff',
        }}>Event Log</span>
        <span style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(255,255,255,0.3)',
        }}>({logs.length})</span>
      </div>
      <div style={{
        maxHeight: 400,
        overflowY: 'auto',
        padding: '8px 0',
      }}>
        {logs.length === 0 ? (
          <div style={{
            padding: 24,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 13,
          }}>No events yet</div>
        ) : (
          logs.map(event => (
            <div key={event.id} style={{
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}>
              <span style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap',
                marginTop: 2,
              }}>{formatTime(event.timestamp)}</span>
              <span style={{ fontSize: 12 }}>{severityIcon[event.severity]}</span>
              <span style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: severityColor[event.severity],
                whiteSpace: 'nowrap',
                marginTop: 1,
              }}>{event.type}</span>
              <span style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.4,
              }}>{event.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function GuardianPage() {
  const { address, isConnected } = useAccount();
  const { predictionMarket } = useContracts();

  // Read owner from contract
  const { data: ownerAddress, isLoading: isOwnerLoading } = useReadContract({
    address: predictionMarket,
    abi: ROUND_MARKET_ABI,
    functionName: 'owner',
  });

  const ADMIN_ADDRESSES = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Deployer / Default Owner
  ];

  const isAdmin = isConnected && address && (
    address.toLowerCase() === ownerAddress?.toLowerCase() ||
    ADMIN_ADDRESSES.map(a => a.toLowerCase()).includes(address.toLowerCase())
  );

  const [status, setStatus] = useState<GuardianStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Fetch guardian status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${GUARDIAN_API}/guardian/status`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setStatus(data);
      setError(null);
      setLastUpdate(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Guardian API');
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for updates
  useEffect(() => {
    if (!isAdmin) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus, isAdmin]);

  // Trigger manual AI analysis
  const triggerAnalysis = async () => {
    setActionLoading('analyze');
    try {
      await fetch(`${GUARDIAN_API}/guardian/analyze`, { method: 'POST' });
      await fetchStatus();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  // Execute recovery action
  const executeRecovery = async (action: string) => {
    setActionLoading(action);
    try {
      await fetch(`${GUARDIAN_API}/guardian/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await new Promise(r => setTimeout(r, 1000));
      await fetchStatus();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  // Simulate failure
  const simulateFailure = async (type: string) => {
    setActionLoading(`sim-${type}`);
    try {
      await fetch(`${GUARDIAN_API}/guardian/simulate/${type}`, { method: 'POST' });
      await new Promise(r => setTimeout(r, 500));
      await fetchStatus();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const health = status?.health;
  const overallHealth = health?.overallHealth || 'healthy';

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 24, padding: '48px 32px', maxWidth: 440, width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <span style={{ fontSize: 48 }}>🛡️</span>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Protocol Guardian Locked</h1>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.5, margin: 0 }}>
              Access to this dashboard is restricted to authorized platform administrators. Please connect your administrator wallet.
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isOwnerLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.5)' }}>Verifying credentials...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 24, padding: '48px 32px', maxWidth: 440, width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <span style={{ fontSize: 48 }}>🚫</span>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Access Denied</h1>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.5, margin: 0 }}>
              Your wallet address is not authorized to access this dashboard.
            </p>
            <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255, 255, 255, 0.3)', marginTop: 12, wordBreak: 'break-all' }}>
              {address}
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 28 }}>🛡️</span>
          <div>
            <h1 style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              margin: 0,
            }}>Protocol Guardian</h1>
            <p style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
              margin: 0,
            }}>AI-Powered Infrastructure Monitor • DotMarket</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: error ? '#ff2244' : severityColor[overallHealth],
            boxShadow: `0 0 10px ${error ? '#ff2244' : severityColor[overallHealth]}`,
            animation: overallHealth === 'critical' || error ? 'pulse 1s infinite' : undefined,
          }} />
          <span style={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: error ? '#ff2244' : severityColor[overallHealth],
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            {error ? 'DISCONNECTED' : loading ? 'CONNECTING...' : overallHealth}
          </span>
        </div>
      </header>

      <main style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        {/* Connection Error */}
        {error && (
          <div style={{
            background: 'rgba(255, 34, 68, 0.08)',
            border: '1px solid rgba(255, 34, 68, 0.3)',
            borderRadius: 14,
            padding: '20px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ff2244', marginBottom: 8 }}>
              ⚠️ Cannot connect to Guardian API
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
              {GUARDIAN_API}/guardian/status — {error}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              Make sure the keeper is running: <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>cd keeper && npm run dev</code>
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {status && <AlertBanner alerts={status.alerts} />}

        {/* Health Status Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: 16,
        }}>
          <StatusCard
            label="Protocol Health"
            value={health ? `${severityIcon[overallHealth]} ${overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}` : '—'}
            severity={overallHealth}
          />
          <StatusCard
            label="RPC Latency"
            value={health ? `${health.rpcLatency} ms` : '—'}
            severity={!health ? 'healthy' : health.rpcLatency > 800 ? 'critical' : health.rpcLatency > 500 ? 'warning' : 'healthy'}
            subtitle={health?.rpcEndpoint?.split('/').pop() || ''}
          />
          <StatusCard
            label="Keeper"
            value={health?.keeperAlive ? 'Running' : 'Offline'}
            severity={!health ? 'healthy' : health.keeperAlive ? 'healthy' : 'critical'}
            subtitle={health ? `Uptime: ${Math.floor(health.keeperUptime / 60)}m ${health.keeperUptime % 60}s` : ''}
          />
          <StatusCard
            label="Oracle"
            value={health?.oracleFresh ? 'Fresh' : 'Stale'}
            severity={!health ? 'healthy' : health.oracleFresh ? 'healthy' : 'degraded'}
            subtitle={health ? `${Math.round(health.oracleLastUpdate / 1000)}s ago` : ''}
          />
          <StatusCard
            label="Current Market"
            value={health ? `#${health.marketId}` : '—'}
            severity="healthy"
            subtitle={health ? `${health.phase} • ${health.timer}s` : ''}
          />
          <StatusCard
            label="Settlement"
            value={health?.lastSettlement || '—'}
            severity="healthy"
          />
          <StatusCard
            label="Pending Tx"
            value={health?.pendingTx ?? '—'}
            severity={!health ? 'healthy' : health.failedTx > 0 ? 'warning' : 'healthy'}
            subtitle={health ? `Failed: ${health.failedTx}` : ''}
          />
          <StatusCard
            label="Memory"
            value={health ? `${health.memoryUsage}%` : '—'}
            severity={!health ? 'healthy' : health.memoryUsage > 85 ? 'critical' : 'healthy'}
            subtitle={health ? `CPU: ${health.cpuUsage}%` : ''}
          />
        </div>

        {/* Two-column: AI Panel + Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          gap: 24,
        }}>
          {/* AI Analysis Panel */}
          <AIPanel analysis={status?.aiAnalysis || null} />

          {/* Controls */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            {/* Recovery Controls */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: 20,
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>🔧</span> Recovery Controls
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { action: 'RESTART_KEEPER', label: 'Restart Keeper', icon: '🔄' },
                  { action: 'SWITCH_RPC', label: 'Switch RPC', icon: '🔀' },
                  { action: 'PAUSE_MARKETS', label: 'Pause Markets', icon: '⏸️' },
                  { action: 'RESUME_MARKETS', label: 'Resume Markets', icon: '▶️' },
                  { action: 'CLEAR_QUEUE', label: 'Clear Queue', icon: '🗑️' },
                ].map(({ action, label, icon }) => (
                  <button
                    key={action}
                    onClick={() => executeRecovery(action)}
                    disabled={!!actionLoading}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '8px 14px',
                      color: '#ffffff',
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === action ? 0.5 : 1,
                      transition: 'all 200ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{icon}</span>
                    {actionLoading === action ? 'Running...' : label}
                  </button>
                ))}
                <button
                  onClick={triggerAnalysis}
                  disabled={!!actionLoading}
                  style={{
                    background: 'rgba(0, 255, 136, 0.08)',
                    border: '1px solid rgba(0, 255, 136, 0.2)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    color: '#00ff88',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading === 'analyze' ? 0.5 : 1,
                    transition: 'all 200ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>🧠</span>
                  {actionLoading === 'analyze' ? 'Analyzing...' : 'Run AI Analysis'}
                </button>
              </div>
            </div>

            {/* Failure Simulation (Demo) */}
            <div style={{
              background: 'rgba(255, 34, 68, 0.03)',
              border: '1px solid rgba(255, 34, 68, 0.1)',
              borderRadius: 14,
              padding: 20,
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#ff6666',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>⚡</span> Failure Simulation
              </div>
              <div style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                marginBottom: 12,
              }}>Inject failures to demonstrate Guardian recovery</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { type: 'keeper-crash', label: 'Crash Keeper', icon: '💀' },
                  { type: 'rpc-slow', label: 'Slow RPC', icon: '🐌' },
                  { type: 'oracle-stale', label: 'Stale Oracle', icon: '⏰' },
                  { type: 'reset', label: 'Reset All', icon: '✅' },
                ].map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => simulateFailure(type)}
                    disabled={!!actionLoading}
                    style={{
                      background: type === 'reset' ? 'rgba(0,255,136,0.06)' : 'rgba(255,34,68,0.06)',
                      border: `1px solid ${type === 'reset' ? 'rgba(0,255,136,0.15)' : 'rgba(255,34,68,0.15)'}`,
                      borderRadius: 8,
                      padding: '8px 14px',
                      color: type === 'reset' ? '#00ff88' : '#ff6666',
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === `sim-${type}` ? 0.5 : 1,
                      transition: 'all 200ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{icon}</span>
                    {actionLoading === `sim-${type}` ? 'Injecting...' : label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Log */}
        {status && <EventLog logs={status.logs} />}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(255,255,255,0.2)',
        }}>
          Last updated: {lastUpdate ? formatTime(lastUpdate) : '—'} • Polling every {POLL_INTERVAL / 1000}s
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
