'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Wallet, CandlestickChart, Target, Trophy, Shield, Cpu, Activity, HardDrive } from 'lucide-react';
import { useMotionSystem, VIEWPORT_SETTINGS } from '@/hooks/useMotionSystem';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { PremiumTabs, type TabItem } from '@/components/ui/PremiumTabs';

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
    shieldTitle: 'Time Synchronization Watchdog',
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

// ── Mobile: PremiumTabs (step panel content) ──────────────────────────────────
function StepPanel({ step }: { step: Step }) {
  const TraderIcon = step.traderIcon;
  const ShieldIcon = step.shieldIcon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card
        hoverEffect={false}
        innerHighlight={false}
        style={{
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
        }}
      >
        <span style={{
          display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px',
          fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px',
          textTransform: 'uppercase', marginBottom: 4,
        }}>
          STEP {step.num}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000', flexShrink: 0,
          }}>
            <TraderIcon size={16} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
            {step.traderTitle}
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          {step.traderDesc}
        </p>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)', flexShrink: 0,
            }}>
              <ShieldIcon size={13} />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {step.shieldTitle}
              </p>
              <span style={{
                fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                letterSpacing: '1px', textTransform: 'uppercase',
              }}>
                DotShield AI Agent
              </span>
            </div>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
            {step.shieldDesc}
          </p>

          <div style={{
            background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '10px 14px',
            fontFamily: 'var(--font-mono)', fontSize: '10.5px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', gap: 5,
          }}>
            {step.shieldMetrics.map((metric, mIdx) => (
              <div key={mIdx} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)' }}>
                <span>{metric.split(': ')[0]}</span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{metric.split(': ')[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Desktop: Original Dual-Column Timeline Layout ─────────────────────────────
function DesktopStepRow({ step, idx, revealCardVariant }: { step: Step; idx: number; revealCardVariant: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const TraderIcon = step.traderIcon;
  const ShieldIcon = step.shieldIcon;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 1fr',
        alignItems: 'stretch',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Left: Trader card */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_SETTINGS}
        variants={revealCardVariant}
        style={{ height: '100%' }}
      >
        <Card
          hoverEffect={false}
          style={{
            height: '100%',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: isHovered ? 'rgba(255,255,255,0.025)' : undefined,
            borderColor: isHovered ? 'rgba(255,255,255,0.15)' : undefined,
            transition: 'all 300ms ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
              color: isHovered ? '#ffffff' : 'var(--text-secondary)',
            }}>
              {step.num}
            </div>
            <span style={{ color: '#ffffff', opacity: isHovered ? 1 : 0.7, display: 'flex', alignItems: 'center' }}>
              <TraderIcon size={18} />
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              {step.traderTitle}
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {step.traderDesc}
          </p>
        </Card>
      </motion.div>

      {/* Centre node */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', position: 'relative' }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: isHovered ? '#ffffff' : 'rgba(255,255,255,0.2)',
          border: isHovered ? '2px solid #ffffff' : '2px solid transparent',
          zIndex: 2,
          transition: 'all 300ms ease',
        }} />
      </div>

      {/* Right: DotShield card */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_SETTINGS}
        variants={revealCardVariant}
        style={{ height: '100%' }}
      >
        <Card
          hoverEffect={false}
          style={{
            height: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: isHovered ? 'rgba(255,255,255,0.025)' : undefined,
            borderColor: isHovered ? 'rgba(255,255,255,0.15)' : undefined,
            transition: 'all 300ms ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: isHovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: isHovered ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 300ms ease',
            }}>
              <span style={{ color: '#ffffff', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                <ShieldIcon size={16} />
              </span>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {step.shieldTitle}
              </h4>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                DotShield AI Agent
              </span>
            </div>
          </div>
          <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, margin: 0 }}>
            {step.shieldDesc}
          </p>
          <div style={{
            background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '10px 14px',
            fontFamily: 'var(--font-mono)', fontSize: '10.5px',
            border: isHovered ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.03)',
            display: 'flex', flexDirection: 'column', gap: 4,
            transition: 'all 300ms ease',
          }}>
            {step.shieldMetrics.map((metric, mIdx) => (
              <div key={mIdx} style={{ display: 'flex', justifyContent: 'space-between', color: isHovered ? '#ffffff' : 'rgba(255,255,255,0.4)' }}>
                <span>{metric.split(': ')[0]}</span>
                <span style={{ fontWeight: 600, color: isHovered ? '#ffffff' : 'rgba(255,255,255,0.6)' }}>
                  {metric.split(': ')[1]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function DesktopDualLayout({ revealCardVariant }: { revealCardVariant: any }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Centre line */}
      <div style={{
        position: 'absolute', left: '50%', top: 40, bottom: 40, width: 2,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.12) 80%, rgba(255,255,255,0.02))',
        transform: 'translateX(-50%)',
      }} />
      {steps.map((step, idx) => (
        <DesktopStepRow key={step.num} step={step} idx={idx} revealCardVariant={revealCardVariant} />
      ))}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function HowItWorksSection() {
  const { shouldReduceMotion, revealCard } = useMotionSystem();
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

      {/* Mobile — PremiumTabs */}
      <div className="block lg:hidden">
        <PremiumTabs tabs={tabs} activeId={activeId} onChange={setActiveId} />
      </div>

      {/* Desktop — original dual-column timeline */}
      <div className="hidden lg:block">
        <DesktopDualLayout revealCardVariant={revealCard} />
      </div>
    </Section>
  );
}
