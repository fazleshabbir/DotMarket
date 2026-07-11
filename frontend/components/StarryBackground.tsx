'use client';

import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  fadeSpeed: number;
  direction: number;
}

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    const maxStars = 40; // much cleaner, sparser stars

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      for (let i = 0; i < maxStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.2 + 0.4, // smaller stars
          opacity: Math.random(),
          fadeSpeed: Math.random() * 0.005 + 0.002, // slower twinkling
          direction: Math.random() > 0.5 ? 1 : -1,
        });
      }
    };

    const drawStars = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(drawStars);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';

      stars.forEach((star) => {
        // Adjust opacity for twinkle effect
        star.opacity += star.fadeSpeed * star.direction;
        if (star.opacity >= 1) {
          star.opacity = 1;
          star.direction = -1;
        } else if (star.opacity <= 0.1) {
          star.opacity = 0.1;
          star.direction = 1;
        }

        ctx.globalAlpha = star.opacity;
        ctx.fillRect(star.x - star.size / 2, star.y - star.size / 2, star.size, star.size);
      });

      // Slowly drift stars downward/sideways to give a feeling of space travel
      stars.forEach((star) => {
        star.y += 0.02;
        star.x += 0.008;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        if (star.x > canvas.width) {
          star.x = 0;
          star.y = Math.random() * canvas.height;
        }
      });

      animationFrameId = requestAnimationFrame(drawStars);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawStars();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        background: '#000000',
      }}
    />
  );
}
