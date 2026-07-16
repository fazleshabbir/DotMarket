'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useMotionSystem, VIEWPORT_SETTINGS } from '@/hooks/useMotionSystem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { COMMUNITY_LINKS } from '@/config/communityLinks';

// SVG Icons
const DiscordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 4.2c-2.43 1.8-3.4 5.23-3.4 8.78c0 3.32.74 5.94 1.48 7.37c1.37 2.65 4.25 3.35 6.42 1.35v0c1.07-.98 2.93-.98 4 0v0c2.17 2 5.05 1.3 6.42-1.35c.74-1.43 1.48-4.05 1.48-7.37c0-3.55-.97-6.98-3.4-8.78c-2.73-2-6.52-2.28-9-1.95c-2.48-.33-6.27-.05-9 1.95z"></path>
    <circle cx="9" cy="12" r="1"></circle>
    <circle cx="15" cy="12" r="1"></circle>
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
  </svg>
);

const TelegramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4"></path>
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

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_SETTINGS}
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
    </Section>
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
