'use client';

import React, { useState } from 'react';
import { Wallet, CandlestickChart, Target, Trophy, Shield, Cpu, Activity, HardDrive } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { PremiumTabs, type TabItem } from '@/components/ui/PremiumTabs';

// ─── Data ─────────────────────────────────────────────────────────────────────
interface Step {
  id: string;
  label: string;
  num: string;
  traderTitle: string;
  traderDesc: string;
  traderIcon: React.ComponentType<{ size: number }>;
  shieldTitle: string;
  shieldDesc: string;
  shieldMetrics: string[];
  shieldIcon: React.ComponentType<{ size: number }>;
}

const steps: Step[] = [
  {
    id: 'connect',
    label: 'Connect',
    num: '01',
    traderTitle: 'Connect Wallet',
    traderDesc: 'Connect your Web3 wallet in seconds. Trade directly with USDC without sign-ups or KYC.',
    traderIcon: Wallet,
    shieldTitle: 'Tx Queue Sentinel',
    shieldDesc: 'DotShield continuously monitors the RPC mempool, preventing transaction failures and cleaning pending queues.',
    shieldMetrics: ['STATUS: ACTIVE', 'LATENCY: OPTIMAL', 'FAILOVER: STANDBY'],
    shieldIcon: Shield,
  },
  {
    id: 'market',
    label: 'Market',
    num: '02',
    traderTitle: 'Choose a Market',
    traderDesc: 'Select a live 1-minute or 5-minute crypto market (BTC, ETH, SOL) tracked by real-time oracle prices.',
    traderIcon: CandlestickChart,
    shieldTitle: 'Oracle Freshness Guard',
    shieldDesc: 'Audits Pyth prices every 3 seconds. Instantly hot-swaps to backup nodes if a price stream stalls.',
    shieldMetrics: ['STATUS: ACTIVE', 'DRIFT: <3s LIMIT', 'MONITORS: 3 PAIRS'],
    shieldIcon: Cpu,
  },
  {
    id: 'predict',
    label: 'Predict',
    num: '03',
    traderTitle: 'Predict UP or DOWN',
    traderDesc: 'Choose where the price will settle before the round locks. Payout multipliers scale dynamically with pool volume.',
    traderIcon: Target,
    shieldTitle: 'Time Sync Watchdog',
    shieldDesc: 'Enforces sub-second round transitions and defends the lock-window, blocking front-running attempts.',
    shieldMetrics: ['STATUS: SYNCED', 'TOLERANCE: <500ms', 'MEMPOOL: SHIELDED'],
    shieldIcon: Activity,
  },
  {
    id: 'collect',
    label: 'Collect',
    num: '04',
    traderTitle: 'Collect Instant Payouts',
    traderDesc: 'When the round ends, oracle prices settle the market automatically. Claim your winnings directly to your wallet.',
    traderIcon: Trophy,
    shieldTitle: 'Self-Healing Keeper Failover',
    shieldDesc: 'If the primary keeper bot drops offline, DotShield automatically resolves stuck rounds under 3 seconds.',
    shieldMetrics: ['STATUS: ONLINE', 'HEARTBEAT: <5s', 'AUTO-RESOLVE: STANDBY'],
    shieldIcon: HardDrive,
  },
];

// ─── Step Content Panel ───────────────────────────────────────────────────────
function StepPanel({ step }: { step: Step }) {
  const TraderIcon = step.traderIcon;
  const ShieldIcon = step.shieldIcon;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        alignItems: 'stretch',
      }}
    >
      {/* Left — Trader Card */}
      <Card
        hoverEffect={false}
        innerHighlight={false}
        style={{
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              flexShrink: 0,
            }}
          >
            <TraderIcon size={20} />
          </div>
          <div>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              STEP {step.num}
            </span>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              {step.traderTitle}
            </h3>
          </div>
        </div>

        <p
          style={{
            fontSize: '13.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {step.traderDesc}
        </p>
      </Card>

      {/* Right — DotShield Card */}
      <Card
        hoverEffect={false}
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.75)',
              flexShrink: 0,
            }}
          >
            <ShieldIcon size={16} />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              {step.shieldTitle}
            </p>
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              DotShield AI Agent
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
          {step.shieldDesc}
        </p>

        {/* Metrics terminal */}
        <div
          style={{
            background: 'rgba(0,0,0,0.45)',
            borderRadius: 8,
            padding: '12px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10.5px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginTop: 'auto',
          }}
        >
          {step.shieldMetrics.map((metric, i) => {
            const [key, value] = metric.split(': ');
            return (
              <div
                key={i}
                style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.45)' }}
              >
                <span>{key}</span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{value}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function HowItWorksSection() {
  const [activeId, setActiveId] = useState(steps[0].id);

  const tabs: TabItem[] = steps.map(s => ({
    id: s.id,
    label: s.label,
    content: <StepPanel step={s} />,
  }));

  return (
    <Section id="how-it-works" aria-labelledby="how-it-works-title">
      <PageHeader
        title="AI-Secured Infrastructure"
        subtitle="The dual-core architecture driving execution and autonomous stability."
      />
      <PremiumTabs tabs={tabs} activeId={activeId} onChange={setActiveId} />
    </Section>
  );
}
