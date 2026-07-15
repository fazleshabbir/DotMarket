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
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid var(--border-2)',
        borderRadius: 'var(--radius-full)',
        padding: '3px',
        alignItems: 'center',
        gap: '3px',
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
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#000000' : 'var(--text-2)',
              background: isActive ? '#ffffff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isActive ? '0 2px 8px rgba(255,255,255,0.1)' : 'none',
              transition: 'all var(--duration-fast) var(--ease-out)',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
