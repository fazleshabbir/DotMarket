'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// ── MAGNETIC SOCIAL ICON COMPONENT ───────────────────────────────────────────
interface MagneticIconProps {
  children: React.ReactNode;
  tooltip: string;
  href: string;
}

function MagneticIcon({ children, tooltip, href }: MagneticIconProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 12, stiffness: 120 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const [hovered, setHovered] = useState(false);

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

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      whileHover={{ scale: 1.1 }}
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
        boxShadow: hovered ? '0 0 15px rgba(139, 92, 246, 0.25)' : 'none',
        borderColor: hovered ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.08)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {children}

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

// ── CANVAS NODES GRAPHIC COMPONENT ───────────────────────────────────────────
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

    const resizeHandler = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 400;
      }
    };
    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      orbitRadius: number;
      orbitSpeed: number;
      angle: number;
    }> = [];

    const numParticles = 35;
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
        orbitRadius: Math.random() * 80 + 40,
        orbitSpeed: (Math.random() - 0.5) * 0.004,
        angle: Math.random() * Math.PI * 2,
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
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw faint orbital rings (Polymarket / Hyperliquid styling)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      
      [100, 160, 220].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw soft central glow
      const glowGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 200);
      glowGrad.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw nodes
      particles.forEach((p, idx) => {
        // Mix simple physics with orbital drift
        p.angle += p.orbitSpeed;
        const targetX = centerX + Math.cos(p.angle) * p.orbitRadius;
        const targetY = centerY + Math.sin(p.angle) * p.orbitRadius;

        p.x += (targetX - p.x) * 0.01 + p.vx;
        p.y += (targetY - p.y) * 0.01 + p.vy;

        // Attract slightly to mouse
        if (mouse.x > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            p.x += dx * 0.012;
            p.y += dy * 0.012;
          }
        }

        // Pulse the node radius
        const displayRadius = p.radius + Math.sin(Date.now() * 0.003 + idx) * 0.5;

        ctx.fillStyle = idx % 3 === 0 ? 'rgba(167, 139, 250, 0.4)' : 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, displayRadius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight ring on some nodes
        if (idx % 8 === 0) {
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, displayRadius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Connect nodes with light lines
      for (let i = 0; i < numParticles; i++) {
        for (let j = i + 1; j < numParticles; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const alpha = (1 - dist / 90) * 0.18;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
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
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', pointerEvents: 'auto' }} />
    </div>
  );
}

// ── SOCIAL GLASS CARD COMPONENT ──────────────────────────────────────────────
interface SocialCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  btnText: string;
  href: string;
}

function SocialCard({ title, desc, icon, btnText, href }: SocialCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(15, 15, 15, 0.3)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflow: 'hidden',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
      className="group hover:border-white/10 hover:shadow-2xl hover:shadow-purple-500/5 hover:-translate-y-2"
    >
      {/* Dynamic glow overlay follow cursor */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: useMotionTemplate`
            radial-gradient(
              250px circle at ${mouseX}px ${mouseY}px,
              rgba(139, 92, 246, 0.05),
              transparent 80%
            )
          `,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div 
          style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '12px', 
            background: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 24,
            color: '#a78bfa',
            transition: 'border-color 0.2s ease'
          }}
          className="group-hover:border-purple-500/30"
        >
          {icon}
        </div>

        <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 500, color: '#ffffff' }}>
          {title}
        </h3>
        
        <p style={{ margin: '0 0 32px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
          {desc}
        </p>

        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '13px',
            fontWeight: 600,
            color: '#ffffff',
            transition: 'gap 0.2s ease, color 0.2s ease'
          }}
          className="hover:text-purple-400 group-btn"
          onMouseEnter={(e) => e.currentTarget.style.color = '#c084fc'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
        >
          <span>{btnText}</span>
          <ArrowRight size={14} style={{ transition: 'transform 0.2s ease' }} className="group-btn-arrow" />
        </a>
      </div>
    </div>
  );
}

// ── MAIN COMMUNITY SECTION ───────────────────────────────────────────────────
export function CommunitySection() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  const headingText = "Join the DotMarket Community";
  const headingWords = headingText.split(" ");

  return (
    <section 
      style={{ 
        position: 'relative', 
        padding: isMobile ? '80px 16px' : '120px 0', 
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.03)'
      }}
    >
      {/* Stars & Grid background lines enhancement */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'radial-gradient(circle at 50% 50%, rgba(15, 12, 30, 0.6) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          zIndex: 0
        }} 
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        
        {/* TOP LAYOUT - TWO COLUMNS */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: isTablet ? '1fr' : '1.1fr 0.9fr', 
            gap: 64, 
            alignItems: 'center',
            marginBottom: 80
          }}
        >
          {/* LEFT SIDE - CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Original DotMarket SVG Logo */}
            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center' }}>
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
            </div>

            {/* Glowing badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: 20, marginBottom: 20 }}>
              <div 
                style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  background: '#8b5cf6', 
                  boxShadow: '0 0 8px #8b5cf6' 
                }} 
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px' }}>Community</span>
            </div>

            {/* Staggered Word Reveal Heading */}
            <h2 
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
              {headingWords.map((word, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  style={{ display: 'inline-block', marginRight: '0.25em' }}
                >
                  {word}
                </motion.span>
              ))}
            </h2>

            {/* Slide up description */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, marginBottom: 40, maxWidth: 540 }}
            >
              Trade together. Build together. Shape the future of decentralized prediction markets with traders, builders and contributors from around the world.
            </motion.p>

            {/* Primary button & Social link details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <motion.a 
                  href="https://discord.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                  whileHover={{ scale: 1.02 }}
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
                      transition: 'box-shadow 0.2s ease',
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
                <MagneticIcon tooltip="Join Discord" href="https://discord.com">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.5 4.2c-2.43 1.8-3.4 5.23-3.4 8.78c0 3.32.74 5.94 1.48 7.37c1.37 2.65 4.25 3.35 6.42 1.35v0c1.07-.98 2.93-.98 4 0v0c2.17 2 5.05 1.3 6.42-1.35c.74-1.43 1.48-4.05 1.48-7.37c0-3.55-.97-6.98-3.4-8.78c-2.73-2-6.52-2.28-9-1.95c-2.48-.33-6.27-.05-9 1.95z"></path>
                    <path d="M9 12h.01"></path>
                    <path d="M15 12h.01"></path>
                  </svg>
                </MagneticIcon>
                
                <MagneticIcon tooltip="Follow X (Twitter)" href="https://twitter.com">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
                  </svg>
                </MagneticIcon>

                <MagneticIcon tooltip="Join Telegram" href="https://telegram.org">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4"></path>
                  </svg>
                </MagneticIcon>
              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE - VISUAL */}
          {!isTablet && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              style={{ position: 'relative', height: 400 }}
            >
              <NetworkNodesCanvas />
            </motion.div>
          )}
        </div>

        {/* 3 PREMIUM GLASS CARDS */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
            gap: 24,
            marginBottom: 80
          }}
        >
          <SocialCard 
            title="Discord"
            desc="Join discussions, governance updates, market ideas and community events."
            btnText="Join"
            href="https://discord.com"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.5 4.2c-2.43 1.8-3.4 5.23-3.4 8.78c0 3.32.74 5.94 1.48 7.37c1.37 2.65 4.25 3.35 6.42 1.35v0c1.07-.98 2.93-.98 4 0v0c2.17 2 5.05 1.3 6.42-1.35c.74-1.43 1.48-4.05 1.48-7.37c0-3.55-.97-6.98-3.4-8.78c-2.73-2-6.52-2.28-9-1.95c-2.48-.33-6.27-.05-9 1.95z"></path>
                <path d="M9 12h.01"></path>
                <path d="M15 12h.01"></path>
              </svg>
            }
          />
          <SocialCard 
            title="X (Twitter)"
            desc="Follow product updates, announcements and market insights."
            btnText="Follow"
            href="https://twitter.com"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
              </svg>
            }
          />
          <SocialCard 
            title="Telegram"
            desc="Chat with traders in real time and stay connected with the community."
            btnText="Open"
            href="https://telegram.org"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4"></path>
              </svg>
            }
          />
        </div>

        {/* BOTTOM CTA STRIP */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'relative',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.4) 0%, rgba(10, 10, 15, 0.6) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: isMobile ? '32px 24px' : '48px 64px',
            overflow: 'hidden',
          }}
        >
          {/* Animated sweep effect */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.02) 40%, rgba(139, 92, 246, 0.04) 50%, rgba(255, 255, 255, 0.02) 60%, transparent)',
              backgroundSize: '200% 100%',
              animation: 'community-sweep 8s infinite linear',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />

          <div 
            style={{ 
              position: 'relative', 
              zIndex: 1, 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: 32 
            }}
          >
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left' }}>
              <div 
                style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: '16px', 
                  background: 'rgba(139, 92, 246, 0.05)', 
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#a78bfa',
                  flexShrink: 0,
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)',
                  animation: 'community-pulse 3s infinite ease-in-out'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m12-10a4 4 0 1 0-8-0 4 4 0 0 0 8 0z"></path>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 500, color: '#ffffff' }}>
                  Built by the Community
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 450 }}>
                  Every prediction, contribution and discussion helps shape DotMarket.
                </p>
              </div>
            </div>

            <motion.a 
              href="https://discord.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  width: isMobile ? '100%' : 'auto',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                <span>Join the Community</span>
                <ArrowRight size={16} />
              </button>
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Embedded CSS Animations for Sweep and Icon pulse */}
      <style jsx global>{`
        @keyframes community-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes community-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.1); }
          50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(139, 92, 246, 0.25); }
        }
        .magnetic-icon-group:hover {
          color: #a78bfa !important;
        }
        .group-hover\\:border-white\\/10:hover {
          border-color: rgba(255, 255, 255, 0.12) !important;
        }
        .group-hover\\:border-purple-500\\/30:hover {
          border-color: rgba(139, 92, 246, 0.3) !important;
        }
        .hover\\:-translate-y-2:hover {
          transform: translateY(-8px) !important;
        }
        .hover\\:shadow-purple-500\\/5:hover {
          box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.1) !important;
        }
        .group-btn:hover .group-btn-arrow {
          transform: translateX(4px);
        }
      `}</style>
    </section>
  );
}
