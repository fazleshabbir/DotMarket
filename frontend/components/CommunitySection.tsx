'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useMotionSystem } from '@/hooks/useMotionSystem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { COMMUNITY_LINKS } from '@/config/communityLinks';

// SVG Icons
const DiscordIcon = ({ width = 24, height = 24 }: { width?: number | string; height?: number | string }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
);

const XIcon = ({ width = 24, height = 24 }: { width?: number | string; height?: number | string }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TelegramIcon = ({ width = 24, height = 24 }: { width?: number | string; height?: number | string }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.896-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface SocialCard {
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType;
  btnText: string;
  label: string;
}

const socialCards: SocialCard[] = [
  {
    title: 'Discord Server',
    desc: 'Connect with developers and traders, discuss forecast metrics, and stay updated.',
    href: COMMUNITY_LINKS.discord,
    icon: DiscordIcon,
    btnText: 'Join Discord',
    label: 'DISCORD',
  },
  {
    title: 'X Announcements',
    desc: 'Get real-time announcements, platform updates, and dynamic sentiment audits.',
    href: COMMUNITY_LINKS.twitter,
    icon: XIcon,
    btnText: 'Follow on X',
    label: 'X (TWITTER)',
  },
  {
    title: 'Telegram Chat',
    desc: 'Join the high-speed chat room, read community feedback, and chat with contributors.',
    href: COMMUNITY_LINKS.telegram,
    icon: TelegramIcon,
    btnText: 'Join Telegram',
    label: 'TELEGRAM',
  },
];

export function CommunitySection() {
  const [mounted, setMounted] = useState(false);

  const { revealCard, staggerContainer } = useMotionSystem();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobileQuery = useMediaQuery('(max-width: 768px)');
  const isMobile = mounted ? isMobileQuery : false;

  return (
    <Section id="community">
      <PageHeader
        title="Join the Community"
        subtitle="Trade together. Build together. Shape the future of decentralized prediction markets."
      />

      {isMobile ? <MobileCommunityLayout /> : <DesktopCommunityLayout />}
    </Section>
  );
}

function DesktopCommunityLayout() {
  const { staggerContainer, viewport } = useMotionSystem();
  
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={staggerContainer(0.08)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: 24,
      }}
    >
      {socialCards.map((social, idx) => (
        <SocialCardItem key={idx} social={social} />
      ))}
    </motion.div>
  );
}

function MobileCommunityLayout() {
  const { revealCard, staggerContainer, staggerItem, viewport } = useMotionSystem();

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={staggerContainer(0.1)}
      style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 12, position: 'relative', willChange: 'transform, opacity' }}
    >
      {/* Animated Background Glow for Premium feel */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} className="animate-pulse-slow" />

      {/* Centered Logo */}
      <motion.div variants={revealCard} style={{ display: 'flex', justifyContent: 'center', marginTop: 16, marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <svg viewBox="0 0 200 60" width="220" height="66" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.08))' }}>
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

      {/* Primary Action */}
      <motion.div variants={staggerItem} style={{ position: 'relative', zIndex: 1 }}>
        <a 
          href={COMMUNITY_LINKS.discord} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block', width: '100%' }}
        >
          <Button
            variant="primary"
            size="lg"
            showArrow={true}
            arrowDirection="up-right"
            style={{ width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DiscordIcon width={18} height={18} />
              <span>Join the Official Discord</span>
            </div>
          </Button>
        </a>
      </motion.div>

      {/* Secondary Platforms */}
      <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginTop: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Or connect via</span>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.1))' }} />
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { icon: <XIcon />, link: COMMUNITY_LINKS.twitter },
            { icon: <TelegramIcon />, link: COMMUNITY_LINKS.telegram }
          ].map((item, i) => (
            <motion.a 
              key={i}
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ textDecoration: 'none' }}
              whileTap={{ scale: 0.9 }}
            >
              <div style={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#ffffff',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}>
                {item.icon}
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
function SocialCardItem({ social }: { social: SocialCard }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = social.icon;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ height: '100%' }}
    >
      <Card
        hoverEffect={true}
        style={{
          height: '100%',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '24px',
          background: isHovered ? 'rgba(255, 255, 255, 0.025)' : undefined,
          borderColor: isHovered ? 'rgba(255, 255, 255, 0.15)' : undefined,
          transition: 'all 250ms var(--ease-out)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              transition: 'all 250ms ease',
              borderColor: isHovered ? 'rgba(255, 255, 255, 0.2)' : undefined,
            }}>
              <Icon />
            </div>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              letterSpacing: '1px',
            }}>
              {social.label}
            </span>
          </div>

          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.2px',
              marginBottom: '8px',
            }}>
              {social.title}
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {social.desc}
            </p>
          </div>
        </div>

        <a
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', width: '100%' }}
        >
          <Button
            variant="secondary"
            showArrow={true}
            arrowDirection="up-right"
            style={{ width: '100%' }}
          >
            {social.btnText}
          </Button>
        </a>
      </Card>
    </div>
  );
}
