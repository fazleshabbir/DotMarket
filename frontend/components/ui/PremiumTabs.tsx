'use client';

/**
 * PremiumTabs — Shared tab component used by HowItWorksSection and RoadmapSection.
 *
 * Direction-aware animation: forward navigation slides content up; backward
 * navigation slides content down. This eliminates the collision glitch that
 * occurs when both the exiting and entering panels move in the same direction.
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

// ─── Direction-aware variants ─────────────────────────────────────────────────
// `custom` receives the direction: +1 (forward) or -1 (backward).
// Forward  → enter from below  (+y), exit to above  (−y)
// Backward → enter from above  (−y), exit to below  (+y)
const panelVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    y: dir * 10,
  }),
  center: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: dir * -8,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  }),
};

// ─── Component ────────────────────────────────────────────────────────────────
export function PremiumTabs({ tabs, activeId, onChange }: PremiumTabsProps) {
  const uid = useId();
  const tabListRef = useRef<HTMLDivElement>(null);
  // Persist direction between renders without causing re-renders
  const directionRef = useRef<number>(1);

  const handleChange = useCallback(
    (id: string) => {
      const newIdx = tabs.findIndex(t => t.id === id);
      const oldIdx = tabs.findIndex(t => t.id === activeId);
      directionRef.current = newIdx >= oldIdx ? 1 : -1;
      onChange(id);
    },
    [tabs, activeId, onChange]
  );

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
      handleChange(tabs[next].id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[next]?.focus();
    },
    [tabs, handleChange]
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
          WebkitTapHighlightColor: 'transparent',
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
              onClick={() => handleChange(tab.id)}
              onKeyDown={e => handleKeyDown(e, idx)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                color: isActive ? '#000000' : 'rgba(255,255,255,0.45)',
                background: isActive ? '#ffffff' : 'transparent',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 200ms ease, color 200ms ease, box-shadow 200ms ease',
                boxShadow: isActive ? '0 2px 8px rgba(255,255,255,0.12)' : 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                outline: 'none',
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
        style={{ minHeight: 200, position: 'relative' }}
      >
        <AnimatePresence mode="wait" initial={false} custom={directionRef.current}>
          <motion.div
            key={activeId}
            custom={directionRef.current}
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

      {/* Hide scrollbar on webkit */}
      <style>{`
        [role="tablist"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
