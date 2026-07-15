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
    <nav style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      padding: '0 20px',
      background: 'transparent',
    }}>
      {DOCS_NAV.map((section, idx) => (
        <div key={idx}>
          <h3 style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--text-3, #6b6b6b)',
            textTransform: 'uppercase',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {section.icon}
            {section.title}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {section.items.map((item, i) => {
              const isActive = pathname === item.href;
              return (
                <li key={i}>
                  <Link
                    href={item.href}
                    onClick={onItemClick}
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      color: isActive ? 'var(--text-1, #f0f0f0)' : 'var(--text-2, #a3a3a3)',
                      textDecoration: 'none',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                      fontWeight: isActive ? 500 : 400,
                      transition: 'background 0.15s ease, color 0.15s ease',
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
