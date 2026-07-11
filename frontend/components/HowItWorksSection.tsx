'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CandlestickChart, Target, Trophy } from 'lucide-react';
import { useMotionSystem } from '@/hooks/useMotionSystem';

interface Step {
  num: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

const steps: Step[] = [
  {
    num: '01',
    title: 'Connect Wallet',
    desc: 'Connect your Web3 wallet securely.',
    icon: Wallet,
  },
  {
    num: '02',
    title: 'Choose a Market',
    desc: 'Select an active prediction market.',
    icon: CandlestickChart,
  },
  {
    num: '03',
    title: 'Predict YES or NO',
    desc: 'Take your position using USDC.',
    icon: Target,
  },
  {
    num: '04',
    title: 'Claim Rewards',
    desc: 'Receive winnings automatically after settlement.',
    icon: Trophy,
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
    revealCard,
    getFloatingAnimation,
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

  // Timeline Connector Line Animation
  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut' as const,
      },
    },
  };

  // Timeline Container holding both connector line and nodes
  const timelineContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
      },
    },
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
                // Pass custom animation parameters via custom properties
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
          How DotMarket Works
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={revealSubtitle}
          style={{
            color: 'var(--text-secondary)',
            fontSize: '16px',
            maxWidth: '500px',
            margin: '0 auto',
            fontWeight: 400,
          }}
        >
          Predict outcomes in four simple on-chain steps.
        </motion.p>
      </div>

      {/* ── Timeline Section ── */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={timelineContainerVariants}
        style={{ position: 'relative', zIndex: 3 }}
      >
        {/* Horizontal timeline connector line (desktop only) */}
        {isMounted && (
          <div
            className="hidden-mobile-tablet"
            style={{
              position: 'absolute',
              top: '80px',
              left: '12.5%',
              right: '12.5%',
              height: '2px',
              background: 'rgba(255, 255, 255, 0.04)',
              zIndex: 1,
            }}
          >
            <motion.div
              variants={lineVariants}
              style={{
                height: '100%',
                background: 'linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.05))',
                transformOrigin: 'left',
              }}
            />

          </div>
        )}

        {/* Steps Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '32px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {steps.map((step, idx) => {
            const isHovered = hoveredCard === idx;
            const StepIcon = step.icon;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {/* Mobile/Tablet vertical connector lines */}
                {idx < 3 && (
                  <div
                    className="visible-mobile-tablet"
                    style={{
                      position: 'absolute',
                      bottom: '-32px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '2px',
                      height: '32px',
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                      zIndex: 1,
                    }}
                  />
                )}

                <motion.div
                  variants={revealCard}
                  whileHover={shouldReduceMotion ? {} : { y: -6, scale: 1.02, rotateX: 2 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{
                    background: isHovered ? 'rgba(255, 255, 255, 0.025)' : 'rgba(15, 15, 15, 0.4)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderColor: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '36px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transformStyle: 'preserve-3d',
                    perspective: 1000,
                    boxShadow: isHovered
                      ? '0 20px 40px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : '0 10px 30px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
                    transition: 'border-color 250ms ease, background 250ms ease, box-shadow 250ms ease',
                    height: '100%',
                    flex: 1,
                  }}
                >
                  {/* Circular Icon Container */}
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px',
                      position: 'relative',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                      transition: 'border-color 250ms ease',
                      borderColor: isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {/* Slow floating motion for icon */}
                    <div
                      className={shouldReduceMotion ? "" : "floating-icon-css"}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        transition: 'transform 250ms ease',
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        animationDelay: `${idx * 0.4}s`,
                      }}
                    >
                      <StepIcon size={30} />
                    </div>
                  </div>

                  {/* Circular Step Badge */}
                  <div
                    className={`pulse-badge-css-${idx}`}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(82, 82, 82, 0.1) 0%, rgba(20, 20, 20, 0.3) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      marginBottom: '16px',
                      boxShadow: isHovered && !shouldReduceMotion
                        ? '0 0 12px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                        : undefined,
                      borderColor: isHovered ? 'rgba(255,255,255,0.2)' : undefined,
                      color: isHovered ? '#ffffff' : undefined,
                      transition: 'all 250ms ease',
                    }}
                  >
                    {step.num}
                  </div>

                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: '10px',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      maxWidth: '220px',
                    }}
                  >
                    {step.desc}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <style jsx global>{`
        @media (max-width: 1023px) {
          .hidden-mobile-tablet {
            display: none !important;
          }
          .visible-mobile-tablet {
            display: block !important;
          }
        }
        @media (min-width: 1024px) {
          .hidden-mobile-tablet {
            display: block !important;
          }
          .visible-mobile-tablet {
            display: none !important;
          }
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
        @keyframes badgePulse {
          0%, 100% {
            box-shadow: none;
            border-color: rgba(255,255,255,0.05);
            color: var(--text-secondary);
          }
          30%, 70% {
            box-shadow: 0 0 12px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1);
            border-color: rgba(255,255,255,0.2);
            color: #ffffff;
          }
        }
        .pulse-badge-css-0 { animation: badgePulse 10s ease-in-out infinite; }
        .pulse-badge-css-1 { animation: badgePulse 10s ease-in-out infinite 2.5s; }
        .pulse-badge-css-2 { animation: badgePulse 10s ease-in-out infinite 5s; }
        .pulse-badge-css-3 { animation: badgePulse 10s ease-in-out infinite 7.5s; }
      `}</style>
    </section>
  );
}
