'use client';

import React from 'react';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  style?: React.CSSProperties;
}

export function Tabs({ items, activeTab, onChange, style }: TabsProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '24px',
        padding: '4px',
        alignItems: 'center',
        gap: '4px',
        ...style
      }}
    >
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              padding: '6px 18px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#000000' : 'var(--text-secondary)',
              background: isActive ? '#ffffff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isActive ? '0 2px 8px rgba(255,255,255,0.1)' : 'none',
              transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
