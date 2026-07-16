'use client';

import React, { useEffect, useState } from 'react';

export function AnimatedLogo() {
  return (
    <div 
      style={{ 
        position: 'relative', 
        width: 220, 
        height: 220, 
        margin: '0 auto 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes logoOrbit {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }
      `}</style>
      
      {/* Premium background radial glow */}
      <div
        className="animate-glow-pulse"
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(16px)',
          zIndex: 1,
        }}
      />

      <svg 
        viewBox="0 0 400 400" 
        width="200" 
        height="200" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ zIndex: 2 }}
      >
        <defs>
          {/* Mask for true transparency of the inner dot cutout */}
          <mask id="centerLogoMask">
            <rect x="0" y="0" width="400" height="400" fill="white" />
            <g style={{ transformOrigin: '200px 200px', animation: 'logoOrbit 8s linear infinite' }}>
              <circle cx="245" cy="200" r="28" fill="black" />
            </g>
          </mask>
        </defs>

        {/* White Base Circle masked with the cutout */}
        <circle 
          cx="200" 
          cy="200" 
          r="100" 
          fill="#ffffff" 
          mask="url(#centerLogoMask)" 
          style={{ filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.25))' }}
        />

        {/* Minimal high-frequency ticking clock dial indicators */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const r1 = 114;
          const r2 = 122;
          const radVal = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={200 + r1 * Math.cos(radVal)}
              y1={200 + r1 * Math.sin(radVal)}
              x2={200 + r2 * Math.cos(radVal)}
              y2={200 + r2 * Math.sin(radVal)}
              stroke={deg % 90 === 0 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.15)'}
              strokeWidth={deg % 90 === 0 ? '2' : '1'}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}
