'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Hammer, Rocket, CandlestickChart, Smartphone, PlusCircle, Users, Check, Circle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useMotionSystem } from '@/hooks/useMotionSystem';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PageHeader } from '@/components/ui/PageHeader';

import { Card } from '@/components/ui/Card';

interface Milestone {
  phase: string;
  title: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  desc: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  features: string[];
  outcome: string;
}

const milestones: Milestone[] = [
  {
    phase: 'Q1',
    title: 'Foundation',
    status: 'Completed',
    desc: 'Core protocol simulation and smart contracts drafting.',
    icon: Hammer,
    features: ['Protocol architecture math', 'Web3 sandboxed simulations', 'Mock token mechanics', 'Gas consumption drafts'],
    outcome: 'Validated mathematical foundations of prediction pools.',
  },
  {
    phase: 'Q2',
    title: 'Protocol Launch',
    status: 'Completed',
    desc: 'Core smart contract pools deployed on testnet.',
    icon: Rocket,
    features: ['Smart contracts', 'Wallet integration', 'Oracle support', 'USDC settlement'],
    outcome: 'First production-ready protocol release.',
  },
  {
    phase: 'Q3',
    title: 'DotShield Protocols',
    status: 'In Progress',
    desc: 'Launch AI-secured prediction pools and self-healing keeper monitors.',
    icon: CandlestickChart,
    features: ['Multi-collateral pools', 'DotShield AI Monitor', 'Self-Healing Keepers', 'Dynamic Hermes feeds'],
    outcome: 'Active institutional hedging interface.',
  },
  {
    phase: 'Q4',
    title: 'Mobile Trading',
    status: 'Planned',
    desc: 'Launch dedicated responsive mobile terminal app views.',
    icon: Smartphone,
    features: ['PWA mobile wrapper', 'Swipe-to-predict gestures', 'One-tap wallet connect', 'Low-bandwidth feeds'],
    outcome: 'Native-feel trading from any device.',
  },
  {
    phase: '2027',
    title: 'Market Creation',
    status: 'Planned',
    desc: 'Allow user-created custom prediction pools.',
    icon: PlusCircle,
    features: ['Permissionless pools', 'Custom resolution rules', 'Creator yield sharing', 'Cross-chain oracle APIs'],
    outcome: 'Decentralized prediction creator economy.',
  },
  {
    phase: 'Future',
    title: 'DAO Governance',
    status: 'Planned',
    desc: 'Transition protocol mechanics to token voting structures.',
    icon: Users,
    features: ['Governance portal', 'Veto mechanisms', 'Fee parameter voting', 'DAO treasury locks'],
    outcome: '100% community-owned protocol.',
  },
];

// ── MOCK DOTSHIELD SIMULATOR TERMINAL ──
function TerminalSimulator() {
  const [logs, setLogs] = useState<string[]>([
    '[DotShield] Guard active',
    '[DotShield] Latency check: 140ms',
  ]);

  useEffect(() => {
    const sequences = [
      '[DotShield] auditing Pyth latency...',
      '[DotShield] OK (Pyth delta: 1s)',
      '[DotShield] RPC Ping spike: 1800ms ⚠️',
      '[DotShield] Initiating rotative failover...',
      '[DotShield] Swapped -> fallback RPC',
      '[DotShield] Ping latency: 120ms (Restored)',
      '[DotShield] Heartbeat status: Active 🟢',
    ];
    let currentIdx = 0;
    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextLogs = [...prev, sequences[currentIdx]];
        if (nextLogs.length > 3) {
          nextLogs.shift();
        }
        return nextLogs;
      });
      currentIdx = (currentIdx + 1) % sequences.length;
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minHeight: '94px',
        boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.5)',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} className="animate-pulse-live" />
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>DotShield Monitor Console</span>
      </div>
      {logs.map((log, lidx) => (
        <div key={lidx} style={{ opacity: lidx === logs.length - 1 ? 1 : 0.5, transition: 'opacity 0.2s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {log}
        </div>
      ))}
    </div>
  );
}

// 3D Tilt Wrapper with Mouse Spotlight
interface TiltCardProps {
  children: React.ReactNode;
  isActive: boolean;
  shouldReduceMotion: boolean;
}

function TiltCard({ children, isActive, shouldReduceMotion }: TiltCardProps) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateXSpring = useSpring(useTransform(y, [0, 1], [5, -5]), { damping: 20, stiffness: 150 });
  const rotateYSpring = useSpring(useTransform(x, [0, 1], [-5, 5]), { damping: 20, stiffness: 150 });
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !hasHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
    e.currentTarget.style.setProperty('--spotlight-x', `${mouseX}px`);
    e.currentTarget.style.setProperty('--spotlight-y', `${mouseY}px`);
  };

  const handleMouseLeave = () => {
    if (!hasHover) return;
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: shouldReduceMotion || !hasHover ? 0 : rotateXSpring,
        rotateY: shouldReduceMotion || !hasHover ? 0 : rotateYSpring,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        width: '100%',
        height: '100%',
      }}
    >
      <Card
        hoverEffect={false}
        style={{
          position: 'relative',
          padding: '40px 32px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: isActive ? 'rgba(255,255,255,0.04)' : undefined,
          borderColor: isActive ? 'rgba(255,255,255,0.22)' : undefined,
          boxShadow: isActive 
            ? '0 30px 60px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)' 
            : undefined,
          transition: 'border-color 250ms ease, background 250ms ease, box-shadow 250ms ease',
          overflow: 'hidden',
        }}
      >
        {/* Reflection & Spotlight Layer */}
        {!shouldReduceMotion && hasHover && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(220px circle at var(--spotlight-x, 0px) var(--spotlight-y, 0px), rgba(255,255,255,0.04), transparent 80%)',
              mixBlendMode: 'overlay',
            }}
          />
        )}
        <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </Card>
    </motion.div>
  );
}

// ── MAIN ROADMAP SECTION ─────────────────────────────────────────────────────
export function RoadmapSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(2); // Default to current: Q3
  const [mounted, setMounted] = useState(false);

  const isMobileQuery = useMediaQuery('(max-width: 768px)');
  const isTabletQuery = useMediaQuery('(max-width: 1024px)');

  const isMobile = mounted ? isMobileQuery : false;
  const isTablet = mounted ? isTabletQuery : false;

  const {
    revealHeading,
    revealSubtitle,
    revealCard,
    staggerContainer,
    getFloatingAnimation,
    shouldReduceMotion,
  } = useMotionSystem();

  useEffect(() => {
    setMounted(true);
  }, []);

  // IntersectionObserver to track visible cards asynchronously without scroll blocking or layout thrashing
  useEffect(() => {
    if (!mounted) return;
    const container = containerRef.current;
    if (!container) return;
    const children = container.children;

    const observerOptions = {
      root: container,
      rootMargin: '0px -30% 0px -30%',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Array.from(children).indexOf(entry.target);
          if (idx !== -1) {
            setActiveIdx(idx);
          }
        }
      });
    }, observerOptions);

    Array.from(children).forEach((child) => {
      observer.observe(child);
    });

    return () => {
      observer.disconnect();
    };
  }, [mounted]);

  // Click handler on top nodes to scroll them into viewport view
  const scrollToMilestone = (idx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const children = container.children;
    if (!children[idx]) return;
    const child = children[idx] as HTMLElement;

    const scrollLeft = child.offsetLeft - (container.clientWidth - child.clientWidth) / 2;
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    setActiveIdx(idx);
  };

  const scrollForward = () => {
    const nextIdx = Math.min(activeIdx + 1, milestones.length - 1);
    scrollToMilestone(nextIdx);
  };

  const scrollBackward = () => {
    const prevIdx = Math.max(activeIdx - 1, 0);
    scrollToMilestone(prevIdx);
  };

  // Node styles generator helper
  const getNodeIndicator = (idx: number, status: string) => {
    const isActive = activeIdx === idx;
    if (status === 'Completed') {
      return (
        <div
          style={{
            width: isActive ? 28 : 22,
            height: isActive ? 28 : 22,
            borderRadius: '50%',
            background: '#ffffff',
            border: '2px solid #ffffff',
            color: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isActive ? '0 0 15px rgba(255,255,255,0.4)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <Check size={isActive ? 14 : 11} strokeWidth={3} />
        </div>
      );
    }
    if (status === 'In Progress') {
      return (
        <div
          style={{
            width: isActive ? 28 : 22,
            height: isActive ? 28 : 22,
            borderRadius: '50%',
            background: '#000000',
            border: '2px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isActive ? '0 0 15px rgba(255,255,255,0.4)' : 'none',
            transition: 'all 0.3s ease',
            position: 'relative',
          }}
        >
          <motion.div
            animate={shouldReduceMotion ? {} : {
              scale: [1, 1.35, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ffffff',
            }}
          />
        </div>
      );
    }
    // Planned / Upcoming
    return (
      <div
        style={{
          width: isActive ? 28 : 22,
          height: isActive ? 28 : 22,
          borderRadius: '50%',
          background: '#000000',
          border: isActive ? '2px solid #ffffff' : '2px solid rgba(255, 255, 255, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isActive ? '0 0 15px rgba(255,255,255,0.4)' : 'none',
          transition: 'all 0.3s ease',
        }}
      />
    );
  };

  return (
    <section
      id="roadmap"
      style={{
        position: 'relative',
        padding: '120px 24px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        overflow: 'visible',
      }}
    >
      {/* ── Background Aesthetics (Stars, spotlights, grids) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.01) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <PageHeader
        title="Roadmap"
        subtitle="Building the future of high-frequency prediction markets."
      />

      {/* ── INTERACTIVE TIMELINE HEADER NAVIGATION ── */}
      {mounted && (
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 840, margin: '0 auto 64px auto', padding: '0 16px' }}>
          {/* Connector Line Base */}
          <div
            style={{
              position: 'absolute',
              top: '13px',
              left: '40px',
              right: '40px',
              height: '2px',
              background: 'rgba(255, 255, 255, 0.08)',
              zIndex: 1,
            }}
          >
            {/* Live Progress Bar drawing */}
            <div
              style={{
                width: `${(activeIdx / (milestones.length - 1)) * 100}%`,
                height: '100%',
                background: 'linear-gradient(to right, rgba(255,255,255,0.2), #ffffff)',
                transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 10px rgba(255,255,255,0.5)',
              }}
            />
          </div>

          {/* Interactive Milestone Indicator circles */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 2,
              gap: 12,
            }}
          >
            {milestones.map((milestone, idx) => {
              const isActive = activeIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => scrollToMilestone(idx)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: 8,
                    textAlign: 'center',
                    flex: '1',
                  }}
                >
                  {getNodeIndicator(idx, milestone.status)}
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: '#ffffff',
                      opacity: 0.9,
                      transition: 'all 0.25s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    {milestone.phase}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── NAVIGATION ARROWS ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          maxWidth: 840,
          margin: '0 auto 24px auto',
          padding: '0 16px',
        }}
      >
        <button
          onClick={scrollBackward}
          disabled={activeIdx === 0}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
            opacity: activeIdx === 0 ? 0.3 : 1,
            transition: 'all 200ms ease',
          }}
          className="nav-arrow-btn"
          aria-label="Previous milestone"
        >
          <ArrowLeft size={15} />
        </button>
        <button
          onClick={scrollForward}
          disabled={activeIdx === milestones.length - 1}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: activeIdx === milestones.length - 1 ? 'not-allowed' : 'pointer',
            opacity: activeIdx === milestones.length - 1 ? 0.3 : 1,
            transition: 'all 200ms ease',
          }}
          className="nav-arrow-btn"
          aria-label="Next milestone"
        >
          <ArrowRight size={15} />
        </button>
      </div>

      {/* ── TIMELINE CARDS TRACK CONTAINER ── */}
      <motion.div
        ref={containerRef}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer(0.08)}
        className="roadmap-track"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 24,
          padding: isMobile ? '8px 16px' : '8px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          position: 'relative',
          zIndex: 3,
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {milestones.map((m, idx) => {
          const isActive = activeIdx === idx;
          const MilestoneIcon = m.icon;

          return (
            <motion.div
              key={idx}
              variants={revealCard}
              style={{
                flex: isMobile ? '0 0 85vw' : isTablet ? '0 0 320px' : '0 0 350px',
                scrollSnapAlign: 'center',
                opacity: isActive ? 1 : 0.5,
                transition: 'opacity 300ms ease',
                transformStyle: 'preserve-3d',
              }}
            >
              <TiltCard isActive={isActive} shouldReduceMotion={shouldReduceMotion}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', flex: 1 }}>
                  
                  {/* Top Details (Quarter & Status Badges) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 700,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        letterSpacing: '1px',
                        transition: 'all 250ms ease',
                      }}
                    >
                      {m.phase}
                    </span>
                    {/* Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {m.status === 'Completed' ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.15)',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontWeight: 600,
                        }}>
                          <Check size={8} strokeWidth={3} />
                          <span>COMPLETED</span>
                        </div>
                      ) : m.status === 'In Progress' ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.25)',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontWeight: 600,
                        }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ffffff' }} className="animate-pulse-live" />
                          <span>IN PROGRESS</span>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontWeight: 500,
                          opacity: 0.6,
                        }}>
                          <span>PLANNED</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Circular Icon Container */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                      transition: 'all 250ms ease',
                    }}
                  >
                    <div
                      className={shouldReduceMotion ? "" : "floating-icon-css"}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        transition: 'all 250ms ease',
                        animationDelay: `${idx * 0.45}s`,
                      }}
                    >
                      <MilestoneIcon size={26} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#ffffff',
                        marginBottom: '10px',
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {m.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {m.desc}
                    </p>
                  </div>

                  {/* Features Bullet List */}
                  <div style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <span style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '10px', textTransform: 'uppercase' }}>Scope Metrics</span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {m.features.map((feat, fidx) => {
                        const isCompleted = m.status === 'Completed';
                        const isInProgress = m.status === 'In Progress';
                        return (
                          <li key={fidx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '12px' }}>
                            {isCompleted ? (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff', display: 'inline-flex', opacity: 0.9 }} />
                            ) : isInProgress ? (
                              <span style={{ display: 'inline-flex', position: 'relative', width: 6, height: 6 }}>
                                <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#ffffff', opacity: 0.75 }} />
                                <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', width: 6, height: 6, background: '#ffffff' }} />
                              </span>
                            ) : (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent' }} />
                            )}
                            <span style={{
                              color: isCompleted ? '#ffffff' : isInProgress ? 'var(--text-secondary)' : 'var(--text-muted)',
                              fontWeight: isInProgress ? 500 : 400,
                              opacity: isCompleted ? 0.95 : isInProgress ? 0.8 : 0.6
                            }}>
                              {feat}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* DotShield Active Console (Phase 2 Card Only) */}
                  {m.phase === 'Q3' && (
                    <TerminalSimulator />
                  )}



                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Apple-Style Slide Indicator Dots Track */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
        {milestones.map((_, idx) => {
          const isActive = activeIdx === idx;
          return (
            <div
              key={idx}
              onClick={() => scrollToMilestone(idx)}
              style={{
                width: isActive ? 24 : 6,
                height: 6,
                borderRadius: 3,
                background: isActive ? '#ffffff' : 'rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              title={`Go to Phase ${idx + 1}`}
            />
          );
        })}
      </div>

      {/* Hide scrollbars style */}
      <style jsx global>{`
        .roadmap-track::-webkit-scrollbar {
          display: none !important;
        }
        @keyframes floatIcon {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .floating-icon-css {
          animation: floatIcon 5s ease-in-out infinite;
        }
        .nav-arrow-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.22) !important;
          transform: scale(1.05);
        }
        .nav-arrow-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
      `}</style>
    </section>
  );
}
