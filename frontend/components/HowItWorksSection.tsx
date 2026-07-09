'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Wallet, CandlestickChart, Target, Trophy } from 'lucide-react';

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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const scrollLineProgress = useTransform(scrollYProgress, [0.2, 0.6], [0, 1]);
  const lineWidthSpring = useSpring(scrollLineProgress, { stiffness: 100, damping: 30 });

  // Continuous light pulse state
  const [pulseIndex, setPulseIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

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
      {/* ── Background Aesthetics ── */}
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(700px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.015), transparent 40%)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Floating particles */}
      {isMounted && !prefersReducedMotion && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: 3 + (i % 3),
                height: 3 + (i % 3),
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                top: `${20 + i * 12}%`,
                left: `${15 + i * 15}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, 15, 0],
                opacity: [0.1, 0.4, 0.1],
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
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
          initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
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
      <div style={{ position: 'relative', zIndex: 3 }}>
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
              style={{
                height: '100%',
                background: 'linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.05))',
                width: prefersReducedMotion ? '100%' : lineWidthSpring,
                transformOrigin: 'left',
              }}
            />
            {/* Continuously moving pulse */}
            {!prefersReducedMotion && (
              <motion.div
                style={{
                  position: 'absolute',
                  top: '-3px',
                  width: '80px',
                  height: '8px',
                  borderRadius: '4px',
                  background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent)',
                  filter: 'blur(2px)',
                }}
                animate={{
                  left: ['0%', '100%'],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}
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
            const isPulseActive = pulseIndex === idx;
            const StepIcon = step.icon;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ position: 'relative' }}
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
                  initial={prefersReducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{
                    duration: 0.6,
                    delay: prefersReducedMotion ? 0 : idx * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
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
                    transition: 'border-color 250ms ease, background 250ms ease, box-shadow 250ms ease, transform 250ms ease',
                    transform: isHovered 
                      ? 'translateY(-8px) scale(1.03)' 
                      : 'translateY(0px) scale(1)',
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
                    <motion.div
                      animate={prefersReducedMotion ? {} : {
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 3 + (idx % 2),
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        transition: 'transform 250ms ease',
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      <StepIcon size={30} />
                    </motion.div>
                  </div>

                  {/* Circular Step Badge */}
                  <div
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
                      boxShadow: (isHovered || isPulseActive) && !prefersReducedMotion
                        ? '0 0 12px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                        : 'none',
                      borderColor: isHovered || isPulseActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: isHovered || isPulseActive ? '#ffffff' : 'var(--text-secondary)',
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
      </div>

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
      `}</style>
    </section>
  );
}
