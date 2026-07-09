'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const socialLinks = [
  {
    name: 'X (Twitter)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
      </svg>
    ),
    href: 'https://twitter.com',
    color: '#1DA1F2',
    bg: 'rgba(29, 161, 242, 0.1)',
    desc: 'Follow for the latest protocol updates and announcements.',
  },
  {
    name: 'Discord',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h.01"></path>
        <path d="M15 12h.01"></path>
        <path d="M7.5 4.2c-2.43 1.8-3.4 5.23-3.4 8.78c0 3.32.74 5.94 1.48 7.37c1.37 2.65 4.25 3.35 6.42 1.35v0c1.07-.98 2.93-.98 4 0v0c2.17 2 5.05 1.3 6.42-1.35c.74-1.43 1.48-4.05 1.48-7.37c0-3.55-.97-6.98-3.4-8.78c-2.73-2-6.52-2.28-9-1.95c-2.48-.33-6.27-.05-9 1.95z"></path>
      </svg>
    ),
    href: 'https://discord.com',
    color: '#5865F2',
    bg: 'rgba(88, 101, 242, 0.1)',
    desc: 'Join our developer community and participate in governance.',
  },
  {
    name: 'Telegram',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4"></path>
      </svg>
    ),
    href: 'https://telegram.org',
    color: '#0088cc',
    bg: 'rgba(0, 136, 204, 0.1)',
    desc: 'Chat with core contributors and community members 24/7.',
  },
  {
    name: 'GitHub',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"></path>
      </svg>
    ),
    href: 'https://github.com',
    color: '#ffffff',
    bg: 'rgba(255, 255, 255, 0.1)',
    desc: 'Contribute to the open-source DotMarket infrastructure.',
  }
];

export function CommunitySection() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '600px', 
          height: '600px', 
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} 
      />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, marginBottom: 24 }}>
            <div className="animate-pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px' }}>Community</span>
          </div>
          
          <h2 style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 400, fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', marginBottom: 16 }}>
            Join the Movement
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            DotMarket is built by a decentralized global community. Connect with us to shape the future of high-frequency prediction markets.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
            gap: 20 
          }}
        >
          {socialLinks.map((link, idx) => (
            <motion.a
              key={idx}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 20,
                padding: '24px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                textDecoration: 'none',
                transition: 'border-color 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
            >
              <div 
                style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: link.bg, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: link.color,
                  flexShrink: 0
                }}
              >
                {link.icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: '#ffffff' }}>{link.name}</h3>
                  <ArrowRight size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {link.desc}
                </p>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
