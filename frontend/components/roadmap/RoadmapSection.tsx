'use client';

import React, { useState } from 'react';
import { Hammer, Rocket, CandlestickChart, Smartphone, PlusCircle, Users, Check } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { PremiumTabs, type TabItem } from '@/components/ui/PremiumTabs';

// ─── Data ─────────────────────────────────────────────────────────────────────
interface Milestone {
  id: string;
  phase: string;
  title: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  desc: string;
  icon: React.ComponentType<{ size: number }>;
  features: string[];
}

const milestones: Milestone[] = [
  {
    id: 'q1',
    phase: 'Q1',
    title: 'Foundation',
    status: 'Completed',
    desc: 'Core protocol simulation and smart contracts drafting.',
    icon: Hammer,
    features: ['Protocol architecture math', 'Web3 sandboxed simulations', 'Mock token mechanics', 'Gas consumption drafts'],
  },
  {
    id: 'q2',
    phase: 'Q2',
    title: 'Protocol Launch',
    status: 'Completed',
    desc: 'Core smart contract pools deployed on testnet.',
    icon: Rocket,
    features: ['Smart contracts', 'Wallet integration', 'Oracle support', 'USDC settlement'],
  },
  {
    id: 'q3',
    phase: 'Q3',
    title: 'DotShield Protocols',
    status: 'In Progress',
    desc: 'Launch AI-secured prediction pools and self-healing keeper monitors.',
    icon: CandlestickChart,
    features: ['Multi-collateral pools', 'DotShield AI Monitor', 'Self-Healing Keepers', 'Dynamic Hermes feeds'],
  },
  {
    id: 'q4',
    phase: 'Q4',
    title: 'Mobile Trading',
    status: 'Planned',
    desc: 'Launch dedicated responsive mobile terminal app views.',
    icon: Smartphone,
    features: ['PWA mobile wrapper', 'Swipe-to-predict gestures', 'One-tap wallet connect', 'Low-bandwidth feeds'],
  },
  {
    id: 'y2027',
    phase: '2027',
    title: 'Market Creation',
    status: 'Planned',
    desc: 'Allow user-created custom prediction pools.',
    icon: PlusCircle,
    features: ['Permissionless pools', 'Custom resolution rules', 'Creator yield sharing', 'Cross-chain oracle APIs'],
  },
  {
    id: 'future',
    phase: 'Future',
    title: 'DAO Governance',
    status: 'Planned',
    desc: 'Transition protocol mechanics to token voting structures.',
    icon: Users,
    features: ['Governance portal', 'Veto mechanisms', 'Fee parameter voting', 'DAO treasury locks'],
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Milestone['status'] }) {
  if (status === 'Completed') {
    return (
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)',
          padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
        }}
      >
        <Check size={8} strokeWidth={3} />
        COMPLETED
      </div>
    );
  }
  if (status === 'In Progress') {
    return (
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)',
          padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
        }}
      >
        <span
          style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#ffffff', display: 'inline-block',
          }}
          className="animate-pulse-live"
        />
        IN PROGRESS
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600,
        color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)',
        padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
      }}
    >
      PLANNED
    </div>
  );
}

// ─── Milestone Content Panel ──────────────────────────────────────────────────
function MilestonePanel({ m }: { m: Milestone }) {
  const Icon = m.icon;
  const isCompleted = m.status === 'Completed';
  const isInProgress = m.status === 'In Progress';

  return (
    <div
      style={{
        padding: '28px 28px 24px',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.09)',
        background: 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        maxWidth: 720,
        margin: '0 auto',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 24 }}>
        {/* Icon bubble */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: isCompleted ? '#ffffff' : isInProgress ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: isCompleted ? '2px solid #ffffff' : isInProgress ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isCompleted ? '#000000' : '#ffffff',
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>

        {/* Title block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              {m.phase}
            </span>
            <StatusBadge status={m.status} />
          </div>
          <h3
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.4px',
            }}
          >
            {m.title}
          </h3>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              margin: '6px 0 0 0',
              lineHeight: 1.65,
            }}
          >
            {m.desc}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

      {/* Scope metrics label */}
      <span
        style={{
          display: 'block',
          fontSize: '9px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        Scope Metrics
      </span>

      {/* Features grid */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '10px 24px',
        }}
      >
        {m.features.map((feat, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '13px',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isCompleted
                  ? '#ffffff'
                  : isInProgress
                  ? 'rgba(255,255,255,0.7)'
                  : 'rgba(255,255,255,0.25)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: isCompleted
                  ? '#ffffff'
                  : isInProgress
                  ? 'var(--text-secondary)'
                  : 'var(--text-muted)',
              }}
            >
              {feat}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function RoadmapSection() {
  const [activeId, setActiveId] = useState(milestones[0].id);

  const tabs: TabItem[] = milestones.map(m => ({
    id: m.id,
    label: m.phase,
    content: <MilestonePanel m={m} />,
  }));

  return (
    <Section id="roadmap">
      <PageHeader
        title="Roadmap"
        subtitle="Building the future of high-frequency prediction markets."
      />
      <PremiumTabs tabs={tabs} activeId={activeId} onChange={setActiveId} />
    </Section>
  );
}
