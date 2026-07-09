'use client';

import React, { useState } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  innerHighlight?: boolean;
}

export function Card({ children, hoverEffect = true, innerHighlight = true, style, ...props }: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => hoverEffect && setHovered(true)}
      onMouseLeave={() => hoverEffect && setHovered(false)}
      style={{
        background: hovered ? 'rgba(255, 255, 255, 0.025)' : 'rgba(15, 15, 15, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid',
        borderColor: hovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        boxShadow: hovered
          ? '0 20px 40px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
          : innerHighlight 
            ? '0 10px 30px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
            : '0 10px 30px -20px rgba(0,0,0,0.5)',
        transform: hovered ? 'translateY(-8px) scale(1.03)' : 'translateY(0px) scale(1)',
        transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
