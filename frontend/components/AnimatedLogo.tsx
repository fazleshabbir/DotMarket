'use client';

/**
 * AnimatedLogo — GPU-optimised for 60 FPS on iOS Safari.
 *
 * Root causes of the original frame drops, all fixed here:
 *
 * 1. filter: blur() on a div → triggers software rasterisation on iOS every
 *    frame. Replaced with a static radial-gradient div + opacity pulse.
 *
 * 2. box-shadow animation (animate-glow-pulse) → not composited on iOS.
 *    Replaced with an opacity-only pulse on a pre-painted glow layer.
 *
 * 3. drop-shadow filter on the SVG circle → same paint cost as #1.
 *    Removed entirely; glow comes from the separate opacity-animated layer.
 *
 * 4. SVG <mask> + animation inside the mask → iOS forces the entire masked
 *    subtree into software rendering. Fixed by replacing the mask with a
 *    solid black circle that sits on top of the white disc ("painter's
 *    algorithm" cutout), so the orbit runs outside the mask context entirely.
 *
 * 5. Inline <style> tag injected on every render → moved to globals.css.
 *    (Keyframes for logo-orbit, logo-glow-pulse are defined there.)
 *
 * 6. SVG transformOrigin via inline style → unreliable on Safari. The orbiting
 *    element now uses CSS animation defined in globals.css which explicitly
 *    sets transform-origin in a reliable, cross-browser way via translate.
 *
 * All animated properties are exclusively:
 *   - transform (translate, rotate) → compositor only, GPU layer
 *   - opacity                       → compositor only, GPU layer
 *
 * Nothing else is animated.
 */

import React from 'react';

const ORBIT_RADIUS = 45;   // px from centre in the 200×200 SVG viewport
const DOT_RADIUS   = 14;   // px radius of the cutout dot

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
        // Promote this subtree to its own compositor layer once, so the
        // browser doesn't re-evaluate surrounding paint on every frame.
        willChange: 'transform',
        contain: 'layout style paint',
      }}
    >
      {/*
       * Static pre-painted glow layer.
       * NO blur. NO box-shadow. Only opacity is animated → GPU composited.
       */}
      <div
        className="logo-glow-layer"
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: '50%',
          // Pre-paint the gradient once; animation only touches opacity.
          background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)',
          zIndex: 1,
          // GPU layer hint
          willChange: 'opacity',
        }}
      />

      {/*
       * SVG — static geometry + one CSS-animated transform.
       * No filters. No masks. No inline keyframes.
       */}
      <svg
        viewBox="0 0 200 200"
        width="200"
        height="200"
        xmlns="http://www.w3.org/2000/svg"
        style={{ zIndex: 2, overflow: 'visible' }}
        aria-hidden="true"
      >
        {/* ── White base disc ──────────────────────────────────────────── */}
        <circle cx="100" cy="100" r="50" fill="#ffffff" />

        {/*
         * ── Tick marks (clock dial) ───────────────────────────────────
         * Static — computed once, never re-rendered.
         */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const r1     = 57;
          const r2     = 61;
          const rad    = (deg * Math.PI) / 180;
          const isMajor = deg % 90 === 0;
          return (
            <line
              key={deg}
              x1={100 + r1 * Math.cos(rad)}
              y1={100 + r1 * Math.sin(rad)}
              x2={100 + r2 * Math.cos(rad)}
              y2={100 + r2 * Math.sin(rad)}
              stroke={isMajor ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)'}
              strokeWidth={isMajor ? '1' : '0.5'}
              strokeLinecap="round"
            />
          );
        })}

        {/*
         * ── Orbiting cutout dot ───────────────────────────────────────
         *
         * KEY CHANGE: Instead of animating inside a <mask> (which forces
         * software rasterisation on iOS), we place a solid black circle
         * directly on top of the white disc. The cutout is purely visual —
         * painter's-algorithm overlay, 100% compositor-safe.
         *
         * The <g> uses CSS class "logo-orbit-dot" whose @keyframes are
         * defined in globals.css using translate-based transforms so the
         * transform-origin is reliable on all WebKit versions.
         *
         * transform-origin is set explicitly via CSS, not inline style.
         */}
        <g className="logo-orbit-dot">
          <circle
            cx={100 + ORBIT_RADIUS}
            cy={100}
            r={DOT_RADIUS}
            fill="#000000"
          />
        </g>
      </svg>
    </div>
  );
}
