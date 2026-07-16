'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ROUND_MARKET_ABI } from '@/lib/abi';
import { useContracts } from '@/hooks/useNetworkConfig';
import { ConnectButton } from '@/components/ConnectButton';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StarryBackground } from '@/components/StarryBackground';

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
  healthy: 'rgba(0, 255, 136, 0.02)',
  warning: 'rgba(255, 170, 0, 0.02)',
  degraded: 'rgba(255, 102, 0, 0.02)',
  critical: 'rgba(255, 34, 68, 0.02)',
};

const severityBorder: Record<Severity, string> = {
  healthy: 'rgba(0, 255, 136, 0.12)',
  warning: 'rgba(255, 170, 0, 0.12)',
  degraded: 'rgba(255, 102, 0, 0.12)',
  critical: 'rgba(255, 34, 68, 0.12)',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

// ── Components ─────────────────────────────────────────────────────────────

const ShieldIconSvg = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffffff' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LockIconSvg = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffffff' }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function StatusCard({ label, value, severity, subtitle }: {
  label: string;
  value: string | number;
  severity: Severity;
  subtitle?: string;
}) {
  return (
    <Card
      hoverEffect={true}
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: severityBg[severity],
        borderColor: severityBorder[severity],
        transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span style={{
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>{label}</span>
      <span style={{
        fontSize: 24,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        color: severityColor[severity],
        letterSpacing: '-0.5px',
      }}>{value}</span>
      {subtitle && (
        <span style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>{subtitle}</span>
      )}
    </Card>
  );
}

function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map(alert => (
        <div key={alert.id} style={{
          background: severityBg[alert.severity],
          border: `1px solid ${severityBorder[alert.severity]}`,
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 16 }}>{severityIcon[alert.severity]}</span>
          <span style={{
            fontSize: 11,
            color: severityColor[alert.severity],
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>{alert.rule.toUpperCase()}</span>
          <span style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
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
      <Card
        hoverEffect={false}
        style={{
          padding: 24,
          textAlign: 'center',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '220px',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>AI Analysis Idle</div>
        <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-muted)', opacity: 0.8 }}>Activates when issues are detected</div>
      </Card>
    );
  }

  return (
    <Card
      hoverEffect={false}
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: severityBg[analysis.overallHealth],
        borderColor: severityBorder[analysis.overallHealth],
      }}
    >
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
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
        }}>Confidence: {analysis.confidence}%</span>
      </div>

      <div style={{
        fontSize: 14,
        color: '#ffffff',
        fontWeight: 600,
      }}>Root Cause: {analysis.rootCause}</div>

      <div style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}>{analysis.summary}</div>

      {analysis.recommendedActions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>Recommended Actions</span>
          {analysis.recommendedActions
            .sort((a, b) => a.priority - b.priority)
            .map((action, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-2)',
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
                background: 'rgba(255,255,255,0.05)',
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
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#ffffff',
              }}>{action.action}</span>
              <span style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                flex: 1,
              }}>{action.reasoning}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function EventLog({ logs }: { logs: LogEvent[] }) {
  return (
    <Card
      hoverEffect={false}
      style={{
        overflow: 'hidden',
        padding: 0,
      }}
    >
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-1)',
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
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
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
            color: 'var(--text-muted)',
            fontSize: 13,
          }}>No events yet</div>
        ) : (
          logs.map(event => (
            <div key={event.id} style={{
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              borderBottom: '1px solid rgba(255,255,255,0.01)',
            }}>
              <span style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                marginTop: 2,
              }}>{formatTime(event.timestamp)}</span>
              <span style={{ fontSize: 12 }}>{severityIcon[event.severity]}</span>
              <span style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: severityColor[event.severity],
                whiteSpace: 'nowrap',
                marginTop: 1,
              }}>{event.type}</span>
              <span style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>{event.message}</span>
            </div>
          ))
        )}
      </div>
    </Card>
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
      <div style={{ position: 'relative', minHeight: '100vh', background: '#000000', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
        <StarryBackground />
        <div 
          className="animate-grid-move"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <Card hoverEffect={false} style={{ position: 'relative', zIndex: 2, padding: '48px 32px', maxWidth: 440, width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <ShieldIconSvg size={48} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.3px' }}>Protocol Guardian Locked</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Access to this dashboard is restricted to authorized platform administrators. Please connect your administrator wallet.
            </p>
          </div>
          <ConnectButton />
        </Card>
      </div>
    );
  }

  if (isOwnerLoading) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
        <StarryBackground />
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Verifying credentials...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', background: '#000000', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
        <StarryBackground />
        <div 
          className="animate-grid-move"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <Card hoverEffect={false} style={{ position: 'relative', zIndex: 2, padding: '48px 32px', maxWidth: 440, width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <LockIconSvg size={48} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.3px' }}>Access Denied</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Your wallet address is not authorized to access this dashboard.
            </p>
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 12, wordBreak: 'break-all' }}>
              {address}
            </p>
          </div>
          <ConnectButton />
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'var(--font-sans)',
      overflowX: 'clip',
      width: '100%',
    }}>
      <StarryBackground />
      
      <div 
        className="animate-grid-move"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Floating Header */}
      <header
        style={{
          position: 'sticky',
          top: 24,
          zIndex: 100,
          margin: '24px auto 0',
          padding: '10px 24px',
          width: 'calc(100% - 48px)',
          maxWidth: 1200,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(5, 5, 5, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-2)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ShieldIconSvg size={24} />
          <div>
            <h1 style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.3px',
              margin: 0,
            }}>Protocol Guardian</h1>
            <p style={{
              fontSize: 10,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              margin: 0,
            }}>AI infrastructure monitor</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: error ? '#ff2244' : severityColor[overallHealth],
              boxShadow: `0 0 10px ${error ? '#ff2244' : severityColor[overallHealth]}`,
              animation: overallHealth === 'critical' || error ? 'pulse 1s infinite' : undefined,
            }} />
            <span style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: error ? '#ff2244' : severityColor[overallHealth],
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              {error ? 'DISCONNECTED' : loading ? 'CONNECTING...' : overallHealth}
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: 1200,
        margin: '24px auto 0',
        padding: '0 24px 64px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        {/* Connection Error */}
        {error && (
          <Card
            hoverEffect={false}
            style={{
              background: 'rgba(255, 34, 68, 0.03)',
              borderColor: 'rgba(255, 34, 68, 0.2)',
              padding: '20px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ff2244', marginBottom: 8 }}>
              ⚠️ Cannot connect to Guardian API
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {GUARDIAN_API}/guardian/status — {error}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Make sure the keeper is running: <code style={{ fontFamily: 'var(--font-mono)' }}>cd keeper && npm run dev</code>
            </div>
          </Card>
        )}

        {/* Active Alerts */}
        {status && <AlertBanner alerts={status.alerts} />}

        {/* Health Status Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
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
            <Card
              hoverEffect={false}
              style={{
                padding: 20,
                background: 'rgba(255,255,255,0.01)',
              }}
            >
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>🔧</span> Recovery Controls
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { action: 'RESTART_KEEPER', label: 'Restart Keeper', icon: '🔄' },
                  { action: 'SWITCH_RPC', label: 'Switch RPC', icon: '🔀' },
                  { action: 'PAUSE_MARKETS', label: 'Pause Markets', icon: '⏸️' },
                  { action: 'RESUME_MARKETS', label: 'Resume Markets', icon: '▶️' },
                  { action: 'CLEAR_QUEUE', label: 'Clear Queue', icon: '🗑️' },
                ].map(({ action, label, icon }) => (
                  <Button
                    key={action}
                    variant="secondary"
                    size="sm"
                    onClick={() => executeRecovery(action)}
                    disabled={!!actionLoading}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      opacity: actionLoading ? 0.5 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{icon}</span>
                    {actionLoading === action ? 'Running...' : label}
                  </Button>
                ))}
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={triggerAnalysis}
                  disabled={!!actionLoading}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    opacity: actionLoading === 'analyze' ? 0.5 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderColor: 'rgba(0, 255, 136, 0.4)',
                    boxShadow: actionLoading === 'analyze' ? 'none' : '0 0 10px rgba(0, 255, 136, 0.1)',
                  }}
                >
                  <span style={{ color: '#00ff88' }}>🧠</span>
                  <span style={{ color: '#000000' }}>{actionLoading === 'analyze' ? 'Analyzing...' : 'Run AI Analysis'}</span>
                </Button>
              </div>
            </Card>

            {/* Failure Simulation (Demo) */}
            <Card
              hoverEffect={false}
              style={{
                padding: 20,
                background: 'rgba(255, 34, 68, 0.01)',
                borderColor: 'rgba(255, 34, 68, 0.08)',
              }}
            >
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
                color: 'var(--text-muted)',
                marginBottom: 16,
              }}>Inject failures to demonstrate Guardian recovery</div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { type: 'keeper-crash', label: 'Crash Keeper', icon: '💀', border: 'rgba(255,34,68,0.15)' },
                  { type: 'rpc-slow', label: 'Slow RPC', icon: '🐌', border: 'rgba(255,34,68,0.15)' },
                  { type: 'oracle-stale', label: 'Stale Oracle', icon: '⏰', border: 'rgba(255,34,68,0.15)' },
                  { type: 'reset', label: 'Reset All', icon: '✅', border: 'rgba(0,255,136,0.15)', color: '#00ff88' },
                ].map(({ type, label, icon, color }) => (
                  <Button
                    key={type}
                    variant="secondary"
                    size="sm"
                    onClick={() => simulateFailure(type)}
                    disabled={!!actionLoading}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: color || '#ff6666',
                      borderColor: color ? 'rgba(0,255,136,0.15)' : 'rgba(255,34,68,0.15)',
                      opacity: actionLoading === `sim-${type}` ? 0.5 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{icon}</span>
                    {actionLoading === `sim-${type}` ? 'Injecting...' : label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Event Log */}
        {status && <EventLog logs={status.logs} />}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          opacity: 0.6,
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
