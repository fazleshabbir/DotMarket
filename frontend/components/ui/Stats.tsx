'use client';

import React, { useState, useEffect, useRef } from 'react';

interface StatsProps {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
}

export function Stats({ label, value, prefix = '', suffix = '' }: StatsProps) {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const numericPart = parseFloat(value.replace(/[^0-9.]/g, ''));
          if (isNaN(numericPart)) {
            setDisplayValue(value);
            return;
          }

          const isDecimal = value.includes('.');
          const startTime = performance.now();
          const duration = 1500;

          const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easeProgress = progress * (2 - progress);
            const currentCount = numericPart * easeProgress;

            if (isDecimal) {
              setDisplayValue(currentCount.toFixed(2));
            } else {
              setDisplayValue(Math.floor(currentCount).toString());
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>
        {label.toUpperCase()}
      </span>
      <strong style={{ fontSize: '32px', fontWeight: 300, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>
        {prefix}
        <span ref={elementRef}>{displayValue}</span>
        {suffix}
      </strong>
    </div>
  );
}
