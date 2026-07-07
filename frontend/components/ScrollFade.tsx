'use client';

import React from 'react';

interface ScrollFadeProps {
  children: React.ReactNode;
  delay?: string;
  style?: React.CSSProperties;
}

export function ScrollFade({ children, style = {} }: ScrollFadeProps) {
  return (
    <div style={style}>
      {children}
    </div>
  );
}
