'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Hammer, Rocket, CandlestickChart, Smartphone, PlusCircle, Users, Check } from 'lucide-react';
import { useMotionSystem } from '@/hooks/useMotionSystem';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';

interface Milestone {
  phase: string;
  title: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  desc: string;
  icon: React.ComponentType<{ size: number }>;
  features: string[];
}

const milestones: Milestone[] = [
  {
    phase: 'Q1',
    title: 'Foundation',
    status: 'Completed',
    desc: 'Core protocol simulation and smart contracts drafting.',
    icon: Hammer,
    features: ['Protocol architecture math', 'Web3 sandboxed simulations', 'Mock token mechanics', 'Gas consumption drafts'],
  },
  {
    phase: 'Q2',
    title: 'Protocol Launch',
    status: 'Completed',
    desc: 'Core smart contract pools deployed on testnet.',
    icon: Rocket,
    features: ['Smart contracts', 'Wallet integration', 'Oracle support', 'USDC settlement'],
  },
  {
    phase: 'Q3',
    title: 'DotShield Protocols',
    status: 'In Progress',
    desc: 'Launch AI-secured prediction pools and self-healing keeper monitors.',
    icon: CandlestickChart,
    features: ['Multi-collateral pools', 'DotShield AI Monitor', 'Self-Healing Keepers', 'Dynamic Hermes feeds'],
  },
  {
    phase: 'Q4',
    title: 'Mobile Trading',
    status: 'Planned',
    desc: 'Launch dedicated responsive mobile terminal app views.',
    icon: Smartphone,
    features: ['PWA mobile wrapper', 'Swipe-to-predict gestures', 'One-tap wallet connect', 'Low-bandwidth feeds'],
  },
  {
    phase: '2027',
    title: 'Market Creation',
    status: 'Planned',
    desc: 'Allow user-created custom prediction pools.',
    icon: PlusCircle,
    features: ['Permissionless pools', 'Custom resolution rules', 'Creator yield sharing', 'Cross-chain oracle APIs'],
  },
  {
    phase: 'Future',
    title: 'DAO Governance',
    status: 'Planned',
    desc: 'Transition protocol mechanics to token voting structures.',
    icon: Users,
    features: ['Governance portal', 'Veto mechanisms', 'Fee parameter voting', 'DAO treasury locks'],
  },
];

// ── Shared StatusBadge (visual unchanged) ─────────────────────────────────────
function StatusBadge({ status }: { status: Milestone['status'] }) {
  if (status === 'Completed') {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
        color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)',
        padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
      }}>
        <Check size={8} strokeWidth={3} />
        COMPLETED
      </div>
    );
  }
  if (status === 'In Progress') {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
        color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)',
        padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} className="animate-pulse-live" />
        IN PROGRESS
      </div>
    );
  }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600,
      color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)',
      padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
    }}>
      PLANNED
    </div>
  );
}

// ── Expandable content for a card ─────────────────────────────────────────────
// Used by both desktop and mobile — keeps inner DOM identical so visuals are unchanged.
function CardFeatures({ m, isCompleted, isInProgress }: {
  m: Milestone;
  isCompleted: boolean;
  isInProgress: boolean;
}) {
  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{
        display: 'block', fontSize: '9px', fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        Scope Metrics
      </span>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {m.features.map((feat, fidx) => (
          <motion.li
            key={fidx}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut', delay: 0.08 + fidx * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px' }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isCompleted ? '#ffffff' : isInProgress ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
              flexShrink: 0,
            }} />
            <span style={{ color: isCompleted ? '#ffffff' : isInProgress ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
              {feat}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

// ── DESKTOP: Scroll-driven progressive reveal ─────────────────────────────────
function DesktopScrollReveal({ milestones }: { milestones: Milestone[] }) {
  // Set of indices that have been revealed — only ever grows (never shrinks on scroll)
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set([0]));
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    milestones.forEach((_, idx) => {
      // Index 0 starts expanded, skip it
      if (idx === 0) return;

      const el = cardRefs.current[idx];
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setExpandedSet(prev => {
              if (prev.has(idx)) return prev; // Already expanded, no rerender
              const next = new Set(prev);
              next.add(idx);
              return next;
            });
            // Trigger once — disconnect after first fire
            observer.disconnect();
          }
        },
        {
          threshold: 0.55,
          rootMargin: '0px 0px -30% 0px',
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
      {/* Vertical connector line */}
      <div style={{
        position: 'absolute', left: 19, top: 0, bottom: 0, width: 2,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        {milestones.map((m, idx) => {
          const Icon = m.icon;
          const isCompleted = m.status === 'Completed';
          const isInProgress = m.status === 'In Progress';
          const isExpanded = expandedSet.has(idx);

          return (
            <motion.div
              key={idx}
              variants={cardVariants}
              ref={el => { cardRefs.current[idx] = el; }}
              style={{ display: 'flex', gap: 24, paddingBottom: idx < milestones.length - 1 ? 32 : 0 }}
            >
              {/* Left: Timeline node — glows softly when just expanded */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 4 }}>
                <motion.div
                  animate={isExpanded && isInProgress
                    ? { boxShadow: ['0 0 0 0px rgba(255,255,255,0)', '0 0 0 5px rgba(255,255,255,0.06)', '0 0 0 0px rgba(255,255,255,0)'] }
                    : { boxShadow: '0 0 0 0px rgba(255,255,255,0)' }
                  }
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: isCompleted ? '#ffffff' : isInProgress ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    border: isCompleted ? '2px solid #ffffff' : isInProgress ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isCompleted ? '#000000' : '#ffffff',
                    flexShrink: 0, position: 'relative', zIndex: 2,
                  }}
                >
                  <Icon size={16} />
                </motion.div>
              </div>

              {/* Right: Card — header always visible, features expand on scroll */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <motion.div
                  animate={{
                    background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                    borderColor: isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                  }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    padding: '20px 24px',
                    borderRadius: 12,
                    border: '1px solid',
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: 'transparent',
                    // Match Card visual exactly
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {/* Header — always visible, no click interaction */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                          color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase',
                        }}>
                          {m.phase}
                        </span>
                        <StatusBadge status={m.status} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
                        {m.title}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: 1.6 }}>
                        {m.desc}
                      </p>
                    </div>
                  </div>

                  {/* Scroll-triggered expandable features */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="features"
                        initial={{ height: 0, opacity: 0, y: 8 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: 4 }}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <CardFeatures m={m} isCompleted={isCompleted} isInProgress={isInProgress} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ── MOBILE: Click accordion (unchanged behaviour from before) ─────────────────
function MobileAccordion({ milestones, revealCard, staggerContainer }: {
  milestones: Milestone[];
  revealCard: Variants;
  staggerContainer: (delay?: number) => Variants;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(2); // Default Q3 open

  return (
    <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
      {/* Vertical connector line */}
      <div style={{
        position: 'absolute', left: 19, top: 0, bottom: 0, width: 2,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={staggerContainer(0.1)}
        style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        {milestones.map((m, idx) => {
          const Icon = m.icon;
          const isCompleted = m.status === 'Completed';
          const isInProgress = m.status === 'In Progress';
          const isOpen = openIdx === idx;

          return (
            <motion.div
              key={idx}
              variants={revealCard}
              style={{ display: 'flex', gap: 24, paddingBottom: idx < milestones.length - 1 ? 32 : 0 }}
            >
              {/* Left: Timeline node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 4 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: isCompleted ? '#ffffff' : isInProgress ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border: isCompleted ? '2px solid #ffffff' : isInProgress ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isCompleted ? '#000000' : '#ffffff',
                  flexShrink: 0, position: 'relative', zIndex: 2,
                }}>
                  <Icon size={16} />
                </div>
              </div>

              {/* Right: Card content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Card
                  hoverEffect={false}
                  innerHighlight={false}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    background: isOpen ? 'rgba(255,255,255,0.03)' : 'transparent',
                    border: isOpen ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    transition: 'all 250ms ease',
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                          color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase',
                        }}>
                          {m.phase}
                        </span>
                        <StatusBadge status={m.status} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
                        {m.title}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: 1.6 }}>
                        {m.desc}
                      </p>
                    </div>
                    {/* Expand chevron */}
                    <div style={{
                      flexShrink: 0, width: 24, height: 24,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', transition: 'transform 250ms ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', marginTop: 2,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded feature list */}
                  {isOpen && (
                    <CardFeatures m={m} isCompleted={isCompleted} isInProgress={isInProgress} />
                  )}
                </Card>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function RoadmapSection() {
  const { revealCard, staggerContainer } = useMotionSystem();
  const [isMounted, setIsMounted] = useState(false);
  const isMobileQuery = useMediaQuery('(max-width: 1023px)');
  const isMobile = isMounted ? isMobileQuery : false;

  useEffect(() => { setIsMounted(true); }, []);

  return (
    <Section id="roadmap">
      <PageHeader
        title="Roadmap"
        subtitle="Building the future of high-frequency prediction markets."
      />
      {isMobile
        ? <MobileAccordion milestones={milestones} revealCard={revealCard} staggerContainer={staggerContainer} />
        : <DesktopScrollReveal milestones={milestones} />
      }
    </Section>
  );
}
