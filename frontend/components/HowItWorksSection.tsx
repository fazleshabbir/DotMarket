'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CandlestickChart, Target, Trophy, Shield, Cpu, Activity, HardDrive } from 'lucide-react';
import { useMotionSystem } from '@/hooks/useMotionSystem';
import { Card } from '@/components/ui/Card';

interface Step {
  num: string;
  // Trader action side
  traderTitle: string;
  traderDesc: string;
  traderIcon: React.ComponentType<{ size: number; className?: string }>;
  // DotShield AI side
  shieldTitle: string;
  shieldDesc: string;
  shieldMetrics: string[];
  shieldIcon: React.ComponentType<{ size: number; className?: string }>;
}

const steps: Step[] = [
  {
    num: '01',
    traderTitle: 'Connect Wallet',
    traderDesc: 'Connect your Web3 wallet in seconds. Trade directly with USDC without sign-ups or KYC.',
    traderIcon: Wallet,
    shieldTitle: 'Tx Queue Sentinel',
    shieldDesc: 'DotShield continuously monitors the RPC mempool, preventing transaction failures and cleaning pending queues.',
    shieldMetrics: [
      'STATUS: ACTIVE',
      'LATENCY: OPTIMAL',
      'FAILOVER: STANDBY',
    ],
    shieldIcon: Shield,
  },
  {
    num: '02',
    traderTitle: 'Choose a Market',
    traderDesc: 'Select a live 1-minute or 5-minute crypto market (BTC, ETH, SOL) tracked by real-time oracle prices.',
    traderIcon: CandlestickChart,
    shieldTitle: 'Oracle Freshness Guard',
    shieldDesc: 'Audits Pyth prices every 3 seconds. Instantly hot-swaps to backup nodes if a price stream stalls.',
    shieldMetrics: [
      'STATUS: ACTIVE',
      'DRIFT: <3s LIMIT',
      'MONITORS: 3 PAIRS',
    ],
    shieldIcon: Cpu,
  },
  {
    num: '03',
    traderTitle: 'Predict UP or DOWN',
    traderDesc: 'Choose where the price will settle before the round locks. Payout multipliers scale dynamically with pool volume.',
    traderIcon: Target,
    shieldTitle: 'Time Synchronization Watchdog',
    shieldDesc: 'Enforces sub-second round transitions and defends the lock-window, blocking front-running attempts.',
    shieldMetrics: [
      'STATUS: SYNCED',
      'TOLERANCE: <500ms',
      'MEMPOOL: SHIELDED',
    ],
    shieldIcon: Activity,
  },
  {
    num: '04',
    traderTitle: 'Collect Instant Payouts',
    traderDesc: 'When the round ends, oracle prices settle the market automatically. Claim your winnings directly to your wallet.',
    traderIcon: Trophy,
    shieldTitle: 'Self-Healing Keeper Failover',
    shieldDesc: 'If the primary keeper bot drops offline, DotShield automatically resolves stuck rounds under 3 seconds.',
    shieldMetrics: [
      'STATUS: ONLINE',
      'HEARTBEAT: <5s',
      'AUTO-RESOLVE: STANDBY',
    ],
    shieldIcon: HardDrive,
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasHover, setHasHover] = useState(false);

  const {
    revealHeading,
    revealSubtitle,
    shouldReduceMotion,
  } = useMotionSystem();

  useEffect(() => {
    setIsMounted(true);
    setHasHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasHover || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    sectionRef.current.style.setProperty('--spotlight-x', `${x}px`);
    sectionRef.current.style.setProperty('--spotlight-y', `${y}px`);
  };

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        zIndex: 10,
        padding: '120px 24px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        overflow: 'hidden',
      }}
      aria-labelledby="how-it-works-title"
    >
      {/* Subtle Noise Texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Spotlight highlight */}
      {hasHover && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(700px circle at var(--spotlight-x, -1000px) var(--spotlight-y, -1000px), rgba(255,255,255,0.015), transparent 40%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}

      {/* Floating particles */}
      {isMounted && !shouldReduceMotion && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="ambient-particle-css"
              style={{
                position: 'absolute',
                width: 3 + (i % 3),
                height: 3 + (i % 3),
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                top: `${20 + i * 12}%`,
                left: `${15 + i * 15}%`,
                animationDuration: `${6 + i * 2}s`,
                animationDelay: `${i * -0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Soft radial glow behind header */}
      <div
        style={{
          position: 'absolute',
          top: '0%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Section Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative', zIndex: 3 }}>
        <motion.h2
          id="how-it-works-title"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={revealHeading}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'min(48px, 9vw)',
            fontWeight: 400,
            color: '#ffffff',
            marginBottom: '16px',
            letterSpacing: '-0.5px',
          }}
        >
          AI-Secured Infrastructure
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={revealSubtitle}
          style={{
            color: 'var(--text-secondary)',
            fontSize: '16px',
            maxWidth: '560px',
            margin: '0 auto',
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          The dual-core architecture driving execution and autonomous stability.
        </motion.p>
      </div>

      {/* ── Dual-Grid Timeline Section ── */}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '64px' }}>
        
        {/* Timeline connector line (desktop only) */}
        {isMounted && (
          <div
            className="hidden-mobile-tablet"
            style={{
              position: 'absolute',
              left: '50%',
              top: '40px',
              bottom: '40px',
              width: '2px',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.1) 20%, rgba(255, 255, 255, 0.12) 80%, rgba(255,255,255,0.02))',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}
          />
        )}

        {steps.map((step, idx) => {
          const isHovered = hoveredCard === idx;
          const TraderIcon = step.traderIcon;
          const ShieldIcon = step.shieldIcon;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setHoveredCard(hoveredCard === idx ? null : idx)}
              className="dual-row-layout"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 1fr',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2,
                cursor: 'pointer',
              }}
            >
              {/* Left Column: Trader Action Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ height: '100%' }}
              >
                <Card
                  hoverEffect={true}
                  style={{
                    height: '100%',
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: isHovered ? 'rgba(255, 255, 255, 0.025)' : undefined,
                    borderColor: isHovered ? 'rgba(255, 255, 255, 0.15)' : undefined,
                    transition: 'all 300ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isHovered ? '#ffffff' : 'var(--text-secondary)',
                    }}>
                      {step.num}
                    </div>
                    <span style={{ color: '#ffffff', opacity: isHovered ? 1 : 0.7, display: 'flex', alignItems: 'center' }}>
                      <TraderIcon size={18} />
                    </span>
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#ffffff',
                      letterSpacing: '-0.3px',
                      margin: 0,
                    }}>
                      {step.traderTitle}
                    </h3>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    {step.traderDesc}
                  </p>
                </Card>
              </motion.div>

              {/* Middle Timeline Node */}
              <div className="hidden-mobile-tablet" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                position: 'relative',
              }}>
                <div
                  className={isHovered ? "radar-pulse-active" : ""}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                    border: isHovered ? '2px solid #ffffff' : '2px solid transparent',
                    boxShadow: isHovered ? 'var(--up-glow)' : 'none',
                    zIndex: 2,
                    transition: 'all 300ms ease',
                    position: 'relative',
                  }}
                />
              </div>

              {/* Right Column: DotShield AI Status Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ height: '100%' }}
              >
                <Card
                  hoverEffect={true}
                  style={{
                    height: '100%',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: isHovered ? 'rgba(255, 255, 255, 0.025)' : undefined,
                    borderColor: isHovered ? 'rgba(255, 255, 255, 0.15)' : undefined,
                    transition: 'all 300ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: isHovered ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 300ms ease',
                    }}>
                      <span style={{ color: '#ffffff', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                        <ShieldIcon size={16} />
                      </span>
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#ffffff',
                        margin: 0,
                      }}>
                        {step.shieldTitle}
                      </h4>
                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}>
                        DotShield AI Agent
                      </span>
                    </div>
                  </div>

                  <p style={{
                    fontSize: '12.5px',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.55,
                    margin: 0,
                  }}>
                    {step.shieldDesc}
                  </p>

                  {/* Micro-Terminal Metrics Panel */}
                  <div style={{
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10.5px',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    borderColor: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
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
        })}
      </div>

      <style jsx global>{`
        @media (max-width: 1023px) {
          .dual-row-layout {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .hidden-mobile-tablet {
            display: none !important;
          }
          .radar-pulse-active {
            display: none !important;
          }
        }
        @keyframes floatParticle {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.1;
          }
          50% {
            transform: translate(15px, -30px);
            opacity: 0.4;
          }
        }
        .ambient-particle-css {
          animation: floatParticle var(--duration, 6s) ease-in-out infinite;
          animation-duration: inherit;
          animation-delay: inherit;
        }
        @keyframes radarRipple {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        .radar-pulse-active::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid #ffffff;
          animation: radarRipple 1.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
      `}</style>
    </section>
  );
}
