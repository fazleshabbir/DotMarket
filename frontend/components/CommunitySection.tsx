'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useMotionSystem } from '@/hooks/useMotionSystem';

// ── MAGNETIC SOCIAL ICON COMPONENT ───────────────────────────────────────────
interface MagneticIconProps {
  children: React.ReactNode;
  tooltip: string;
  href: string;
  delayIndex: number;
}

function MagneticIcon({ children, tooltip, href, delayIndex }: MagneticIconProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 12, stiffness: 120 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const [hovered, setHovered] = useState(false);
  const { getFloatingAnimation, shouldReduceMotion } = useMotionSystem();

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    
    // Magnetic pull constraint
    x.set(distanceX * 0.4);
    y.set(distanceY * 0.4);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  // Hover states: TranslateY -6px, Scale 1.02, RotateX 2deg (adapted for circular icon)
  const hoverProps = shouldReduceMotion ? {} : {
    y: -6,
    scale: 1.05,
    transition: { duration: 0.25, ease: 'easeOut' as const }
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      whileHover={hoverProps}
      whileTap={{ scale: 0.95 }}
      style={{
        x: springX,
        y: springY,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      className="magnetic-icon-element"
    >
      {/* Floating animation inside the icon parent */}
      <div
        className={shouldReduceMotion ? "" : "floating-icon-css"}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animationDelay: `${delayIndex * 0.45}s`,
        }}
      >
        {children}
      </div>

      {/* Premium Tooltip */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          style={{
            position: 'absolute',
            bottom: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f0f11',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
          }}
        >
          {tooltip}
        </motion.div>
      )}
    </motion.a>
  );
}

// ── CANVAS LOGO & NETWORK COMPONENT (BLACK & WHITE) ──────────────────────────
function NetworkNodesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = 450);
    let height = (canvas.height = 400);
    let logoAngle = 45;
    let isVisible = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const resizeHandler = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 400;
      }
    };
    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    // Initialize black & white particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const numParticles = 24;
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1.5,
        color: i % 3 === 0 ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.25)',
      });
    }

    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const draw = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Update logo orbiting cutout coordinates
      logoAngle = (logoAngle + 0.6) % 360;
      const rad = (logoAngle * Math.PI) / 180;
      const offset = 45;
      const cutoutX = cx + offset * Math.cos(rad);
      const cutoutY = cy + offset * Math.sin(rad);

      // --- Draw Dot Logo ---
      // Faint clock dial indicators
      ctx.lineWidth = 1;
      for (let deg = 0; deg < 360; deg += 30) {
        const r1 = 114;
        const r2 = 122;
        const radVal = (deg * Math.PI) / 180;
        ctx.strokeStyle = deg % 90 === 0 ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.07)';
        ctx.beginPath();
        ctx.moveTo(cx + r1 * Math.cos(radVal), cy + r1 * Math.sin(radVal));
        ctx.lineTo(cx + r2 * Math.cos(radVal), cy + r2 * Math.sin(radVal));
        ctx.stroke();
      }

      // Draw Main White Circle with subtle glow
      ctx.shadowColor = 'rgba(255, 255, 255, 0.12)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      // Draw Orbiting Cutout (Black Circle matching background)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cutoutX, cutoutY, 28, 0, Math.PI * 2);
      ctx.fill();

      // --- Draw Particles (White in background, Black when over Logo) ---
      particles.forEach((p, idx) => {
        // Drift gently towards cursor
        if (mouse.x > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            p.x += dx * 0.006;
            p.y += dy * 0.006;
          }
        }

        // Velocity motion
        p.x += p.vx;
        p.y += p.vy;

        // Boundary collision bounce
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Detect if particle is overlaying the white logo geometry
        const distFromCenter = Math.sqrt((p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy));
        const distFromCutout = Math.sqrt((p.x - cutoutX) * (p.x - cutoutX) + (p.y - cutoutY) * (p.y - cutoutY));

        let isOverLogo = distFromCenter <= 100;
        if (isOverLogo && distFromCutout <= 28) {
          isOverLogo = false; // it is in the black cutout dot
        }

        // Draw floating black dots over logo, white dots on background
        ctx.fillStyle = isOverLogo ? 'rgba(0, 0, 0, 0.85)' : p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connect lines in background (monochrome)
      for (let i = 0; i < numParticles; i++) {
        for (let j = i + 1; j < numParticles; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 80) {
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const distFromCenter = Math.sqrt((midX - cx) * (midX - cx) + (midY - cy) * (midY - cy));

            if (distFromCenter > 105) {
              const alpha = (1 - dist / 80) * 0.12;
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeHandler);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', pointerEvents: 'auto' }} />
    </div>
  );
}

// ── MAIN COMMUNITY SECTION ───────────────────────────────────────────────────
export function CommunitySection() {
  const [mounted, setMounted] = useState(false);
  const {
    revealHeading,
    revealSubtitle,
    revealButton,
    fadeUp,
    fadeIn,
    shouldReduceMotion,
  } = useMotionSystem();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobileQuery = useMediaQuery('(max-width: 768px)');
  const isTabletQuery = useMediaQuery('(max-width: 1024px)');

  const isMobile = mounted ? isMobileQuery : false;
  const isTablet = mounted ? isTabletQuery : false;

  return (
    <section 
      style={{ 
        position: 'relative', 
        padding: isMobile ? '60px 16px' : '100px 0', 
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
        background: 'transparent'
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        
        {/* SPLIT LAYOUT - TWO COLUMNS */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: isTablet ? '1fr' : '1.1fr 0.9fr', 
            gap: 64, 
            alignItems: 'center'
          }}
        >
          {/* LEFT SIDE - CONTENT */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Original DotMarket SVG Logo - Reveal first */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeIn}
              style={{ marginBottom: 32, display: 'flex', alignItems: 'center' }}
            >
              <svg viewBox="0 0 200 60" width="130" height="39" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <mask id="communityLogoMask">
                    <rect x="0" y="0" width="200" height="60" fill="white" />
                    <circle cx="20.5" cy="34.5" r="2.8" fill="black" />
                  </mask>
                </defs>
                <circle cx="16" cy="30" r="10" fill="#ffffff" mask="url(#communityLogoMask)" />
                <line x1="32" y1="42" x2="44" y2="18" stroke="#525252" strokeWidth="2" strokeLinecap="round" />
                <text x="54" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#ffffff" letterSpacing="-1">dot</text>
                <text x="95" y="38" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="300" fill="#737373" letterSpacing="-1">Market</text>
              </svg>
            </motion.div>

            {/* Unified Heading reveal */}
            <motion.h2 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={revealHeading}
              style={{ 
                fontSize: isMobile ? '36px' : '54px', 
                fontWeight: 400, 
                fontFamily: "'Cormorant Garamond', serif", 
                color: '#ffffff', 
                lineHeight: 1.1,
                marginBottom: 24,
                letterSpacing: '-1px'
              }}
            >
              Join the DotMarket Community
            </motion.h2>

            {/* Unified Subtitle reveal */}
            <motion.p 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={revealSubtitle}
              style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, marginBottom: 40, maxWidth: 540 }}
            >
              Trade together. Build together. Shape the future of decentralized prediction markets with traders, builders and contributors from around the world.
            </motion.p>

            {/* Unified Button & Social layout reveal */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={revealButton}
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <motion.a 
                  href="https://discord.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    style={{
                      background: '#ffffff',
                      color: '#000000',
                      border: 'none',
                      padding: '14px 32px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 20px rgba(255,255,255,0.15)',
                      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.15)'}
                  >
                    <span>Join Discord</span>
                    <ArrowRight size={16} />
                  </button>
                </motion.a>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secondary Platforms</span>
                  <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}>Stay connected across every platform.</span>
                </div>
              </div>

              {/* Social icons row */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <MagneticIcon tooltip="Join Discord" href="https://discord.com" delayIndex={0}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.5 4.2c-2.43 1.8-3.4 5.23-3.4 8.78c0 3.32.74 5.94 1.48 7.37c1.37 2.65 4.25 3.35 6.42 1.35v0c1.07-.98 2.93-.98 4 0v0c2.17 2 5.05 1.3 6.42-1.35c.74-1.43 1.48-4.05 1.48-7.37c0-3.55-.97-6.98-3.4-8.78c-2.73-2-6.52-2.28-9-1.95c-2.48-.33-6.27-.05-9 1.95z"></path>
                    <path d="M9 12h.01"></path>
                    <path d="M15 12h.01"></path>
                  </svg>
                </MagneticIcon>
                
                <MagneticIcon tooltip="Follow X (Twitter)" href="https://twitter.com" delayIndex={1}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
                  </svg>
                </MagneticIcon>

                <MagneticIcon tooltip="Join Telegram" href="https://telegram.org" delayIndex={2}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4"></path>
                  </svg>
                </MagneticIcon>
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDE - VISUAL */}
          {!isTablet && (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
              style={{ position: 'relative', height: 400 }}
            >
              <NetworkNodesCanvas />
            </motion.div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .magnetic-icon-element:hover {
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.15) !important;
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
