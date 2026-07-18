'use client';

/**
 * PremiumTabs — Shared tab component used by HowItWorksSection and RoadmapSection.
 *
 * Design decisions:
 *  • Entirely CSS-driven styles (no Tailwind) so they can use CSS vars.
 *  • A single AnimatePresence wraps the content panel — the active key
 *    triggers a fade-up exit/enter (200ms) with no layout shift.
 *  • The tab bar uses -webkit-overflow-scrolling: touch for silky iOS scrolling.
 *  • Keyboard: ArrowLeft/ArrowRight wrap-around navigation.
 *  • No accordion, no timeline, no expandable card — tabs only.
 */

import React, { useCallback, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface PremiumTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

// ─── Animation variants ───────────────────────────────────────────────────────
const panelVariants = {
  enter: {
    opacity: 0,
    y: 8,
  },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function PremiumTabs({ tabs, activeId, onChange }: PremiumTabsProps) {
  const uid = useId();
  const tabListRef = useRef<HTMLDivElement>(null);

  // Keyboard arrow-key navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, currentIdx: number) => {
      let next = currentIdx;
      if (e.key === 'ArrowRight') {
        next = (currentIdx + 1) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        next = (currentIdx - 1 + tabs.length) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'Home') {
        next = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        next = tabs.length - 1;
        e.preventDefault();
      } else {
        return;
      }
      onChange(tabs[next].id);
      // Focus the new tab button
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[next]?.focus();
    },
    [tabs, onChange]
  );

  const activeIdx = tabs.findIndex(t => t.id === activeId);

  return (
    <div style={{ width: '100%' }}>
      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Section tabs"
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch' as any,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '4px',
          background: 'rgba(255,255,255,0.025)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.07)',
          marginBottom: 24,
          // Prevent iOS bounce on the bar itself
          WebkitTapHighlightColor: 'transparent',
          // Remove scrollbar on webkit
        }}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              id={`${uid}-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${uid}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={e => handleKeyDown(e, idx)}
              style={{
                // Layout
                flexShrink: 0,
                padding: '8px 16px',
                // Typography
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                // Colours
                color: isActive ? '#000000' : 'rgba(255,255,255,0.45)',
                background: isActive ? '#ffffff' : 'transparent',
                // Shape
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                // Transition
                transition:
                  'background 200ms ease, color 200ms ease, box-shadow 200ms ease, transform 150ms ease',
                boxShadow: isActive ? '0 2px 8px rgba(255,255,255,0.12)' : 'none',
                // iOS tap fix
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                outline: 'none',
                // Prevent minimum height collapse on iOS
                minHeight: 36,
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content Panel ────────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id={`${uid}-panel-${activeId}`}
        aria-labelledby={`${uid}-tab-${activeId}`}
        // Reserve min-height so the panel doesn't collapse between transitions
        style={{ minHeight: 200 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeId}
            variants={panelVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ willChange: 'opacity, transform' }}
          >
            {tabs[activeIdx]?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hide scrollbar on webkit globally for the tab bar */}
      <style>{`
        [role="tablist"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
