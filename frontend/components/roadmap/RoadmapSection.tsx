'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Hammer, Rocket, CandlestickChart, Smartphone, PlusCircle, Users, Check, Circle } from 'lucide-react';
import { useMotionSystem } from '@/hooks/useMotionSystem';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PageHeader } from '@/components/ui/PageHeader';

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
    title: 'Prediction Markets',
    status: 'In Progress',
    desc: 'Launch multi-collateral and advanced metrics forecast pools.',
    icon: CandlestickChart,
    features: ['Multi-collateral pools', 'Dynamic Hermes feeds', 'Advanced charts & stats', 'Custom slip protection'],
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

  const [spotlight, setSpotlight] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
    setSpotlight({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: shouldReduceMotion ? 0 : rotateXSpring,
        rotateY: shouldReduceMotion ? 0 : rotateYSpring,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        width: '100%',
        height: '100%',
      }}
    >
      <div
        className="glass-card-container"
        style={{
          position: 'relative',
          background: isActive ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderColor: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
          borderRadius: '20px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '40px 32px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: isActive 
            ? '0 30px 60px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)' 
            : '0 15px 30px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
          transition: 'border-color 250ms ease, background 250ms ease, box-shadow 250ms ease',
          overflow: 'hidden',
        }}
      >
        {/* Reflection & Spotlight Layer */}
        {!shouldReduceMotion && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `radial-gradient(220px circle at ${spotlight.x}px ${spotlight.y}px, rgba(255,255,255,0.05), transparent 80%)`,
              mixBlendMode: 'overlay',
            }}
          />
        )}
        <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
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
        overflow: 'hidden',
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
            {/* Drawing Line animation */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.05))',
                transformOrigin: 'left',
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

      {/* ── TIMELINE CARDS TRACK CONTAINER ── */}
      <motion.div
        ref={containerRef}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
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
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '22px',
                        fontWeight: isActive ? 600 : 400,
                        color: '#ffffff',
                        marginBottom: '8px',
                        letterSpacing: '-0.2px',
                        transition: 'font-weight 250ms ease',
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
                      {m.features.map((feat, fidx) => (
                        <li key={fidx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: '#ffffff' }}>
                          <span style={{ color: m.status === 'Completed' ? '#ffffff' : 'var(--text-muted)', display: 'inline-flex', opacity: 0.8 }}>
                            <Check size={11} strokeWidth={3} />
                          </span>
                          <span style={{ opacity: m.status === 'Completed' ? 0.95 : 0.7 }}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expected Outcome */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>DELIVERABLE:</span>{' '}
                    <strong style={{ color: '#ffffff', fontWeight: 500 }}>{m.outcome}</strong>
                  </div>

                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </motion.div>

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
      `}</style>
    </section>
  );
}
