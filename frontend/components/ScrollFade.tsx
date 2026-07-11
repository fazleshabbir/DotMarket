'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useMotionSystem } from '@/hooks/useMotionSystem';

interface ScrollFadeProps {
  children: React.ReactNode;
  delay?: string;
  style?: React.CSSProperties;
}

export function ScrollFade({ children, style = {} }: ScrollFadeProps) {
  const { revealCard } = useMotionSystem();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={revealCard}
      style={style}
    >
      {children}
    </motion.div>
  );
}
