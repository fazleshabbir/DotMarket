'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useMotionSystem } from '@/hooks/useMotionSystem';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}

export function PageHeader({ title, subtitle, align = 'center' }: PageHeaderProps) {
  const { revealHeading, revealSubtitle } = useMotionSystem();

  return (
    <div
      style={{
        textAlign: align,
        marginBottom: '64px',
        position: 'relative',
        zIndex: 3,
      }}
    >
      {/* Soft blur/glow behind title */}
      {align === 'center' && (
        <div
          style={{
            position: 'absolute',
            top: '0%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '400px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      <motion.h2
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.02 }}
        variants={revealHeading}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '42px',
          fontWeight: 400,
          color: '#ffffff',
          marginBottom: '16px',
          letterSpacing: '-0.5px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.02 }}
          variants={revealSubtitle}
          style={{
            color: 'var(--text-secondary)',
            fontSize: '15px',
            maxWidth: '500px',
            margin: align === 'center' ? '0 auto' : '0',
            fontWeight: 400,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
