'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Settings, Code2, Globe } from 'lucide-react';

const DOCS_NAV = [
  {
    title: 'User Guide',
    icon: <BookOpen size={16} />,
    items: [
      { title: 'Introduction', href: '/docs/user-guide/introduction' },
      { title: 'Platform Overview', href: '/docs/user-guide/platform-overview' },
      { title: 'Prediction Guide', href: '/docs/user-guide/prediction-guide' },
      { title: 'Rewards & Payouts', href: '/docs/user-guide/rewards-and-payouts' },
      { title: 'Fees', href: '/docs/user-guide/fees' },
      { title: 'Wallet Guide', href: '/docs/user-guide/wallet-guide' },
    ]
  },
  {
    title: 'Protocol',
    icon: <Settings size={16} />,
    items: [
      { title: 'How DotMarket Works', href: '/docs/protocol/how-dotmarket-works' },
      { title: '1-Minute Market Lifecycle', href: '/docs/protocol/1-minute-market-lifecycle' },
      { title: 'Market Resolution', href: '/docs/protocol/market-resolution' },
      { title: 'Oracle System', href: '/docs/protocol/oracle-system' },
    ]
  },
  {
    title: 'Developers',
    icon: <Code2 size={16} />,
    items: [
      { title: 'Supported Networks', href: '/docs/developers/supported-networks' },
      { title: 'Smart Contracts', href: '/docs/developers/smart-contracts' },
      { title: 'Backend Architecture', href: '/docs/developers/backend-architecture' },
      { title: 'API Reference', href: '/docs/developers/api-reference' },
    ]
  },
  {
    title: 'Community',
    icon: <Globe size={16} />,
    items: [
      { title: 'FAQ', href: '/docs/community/faq' },
      { title: 'Community', href: '/docs/community/community' },
      { title: 'Changelog / Roadmap', href: '/docs/community/changelog-roadmap' },
    ]
  }
];

interface SidebarProps {
  onItemClick?: () => void;
}

export function Sidebar({ onItemClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 24px' }}>
      {DOCS_NAV.map((section, idx) => (
        <div key={idx}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {section.icon}
            {section.title}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {section.items.map((item, i) => {
              const isActive = pathname === item.href;
              return (
                <li key={i}>
                  <Link 
                    href={item.href}
                    onClick={onItemClick}
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                      textDecoration: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                      fontWeight: isActive ? 500 : 400,
                      transition: 'all 0.2s ease',
                      borderLeft: isActive ? '2px solid #ffffff' : '2px solid transparent',
                    }}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
