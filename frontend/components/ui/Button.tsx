'use client';

import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useMotionSystem } from '@/hooks/useMotionSystem';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDrag' | 'onDragEnd'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'up' | 'down';
  size?: 'sm' | 'md' | 'lg';
  showArrow?: boolean;
  arrowDirection?: 'right' | 'up-right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      showArrow = false,
      arrowDirection = 'right',
      className = '',
      style,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false);
    const { shouldReduceMotion } = useMotionSystem();

    // Default styles based on DotMarket Black & White aesthetic
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            background: '#ffffff',
            color: '#000000',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: isHovered 
              ? '0 12px 24px -10px rgba(255, 255, 255, 0.15)' 
              : '0 4px 12px -5px rgba(255, 255, 255, 0.08)',
          };
        case 'secondary':
          return {
            background: 'rgba(255, 255, 255, 0.02)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderColor: isHovered ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)',
            boxShadow: isHovered ? '0 10px 20px -10px rgba(0,0,0,0.5)' : 'none',
          };
        case 'outline':
          return {
            background: 'transparent',
            color: '#ffffff',
            border: '1px solid',
            borderColor: isHovered ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.15)',
            boxShadow: 'none',
          };
        case 'ghost':
          return {
            background: isHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
            color: '#ffffff',
            border: '1px solid transparent',
            boxShadow: 'none',
          };
        case 'link':
          return {
            background: 'transparent',
            color: '#ffffff',
            border: 'none',
            padding: 0,
            borderRadius: 0,
            boxShadow: 'none',
            display: 'inline-flex',
          };
        case 'up': // Up-Bet style B&W primary variation
          return {
            background: '#ffffff',
            color: '#000000',
            border: '1px solid rgba(255,255,255,0.95)',
            boxShadow: isHovered 
              ? '0 12px 28px rgba(255, 255, 255, 0.22)' 
              : '0 4px 12px rgba(255, 255, 255, 0.08)',
          };
        case 'down': // Down-Bet style B&W outline variation
          return {
            background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderColor: isHovered ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.15)',
            boxShadow: 'none',
          };
        default:
          return {};
      }
    };

    const getSizeStyles = () => {
      if (variant === 'link') return {};
      switch (size) {
        case 'sm':
          return { padding: '8px 16px', fontSize: '12px', borderRadius: '8px' };
        case 'md':
          return { padding: '12px 24px', fontSize: '13px', borderRadius: '9999px' };
        case 'lg':
          return { padding: '16px 36px', fontSize: '14px', borderRadius: '9999px' };
        default:
          return {};
      }
    };

    // Hover spotlight styles for glass reflection inside button
    const renderSpotlight = () => {
      if (shouldReduceMotion || variant === 'link' || variant === 'ghost') return null;
      return (
        <span
          className="btn-spotlight-layer"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            opacity: isHovered ? 0.06 : 0,
            background: 'radial-gradient(50px circle at var(--btn-x, 50%) var(--btn-y, 50%), rgba(255,255,255,0.8), transparent 80%)',
            transition: 'opacity 250ms ease',
          }}
        />
      );
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (shouldReduceMotion || variant === 'link') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      e.currentTarget.style.setProperty('--btn-x', `${x}px`);
      e.currentTarget.style.setProperty('--btn-y', `${y}px`);
    };

    const handleMouseEnterEvent = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(true);
      if (onMouseEnter) onMouseEnter(e);
    };

    const handleMouseLeaveEvent = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(false);
      if (onMouseLeave) onMouseLeave(e);
    };

    // Lucide Arrow component selection
    const ArrowIcon = arrowDirection === 'up-right' ? ArrowUpRight : ArrowRight;

    // Framer Motion spring transition configs
    const hoverScale = shouldReduceMotion ? 1 : 1.02;
    const hoverY = shouldReduceMotion ? 0 : -2;
    const pressScale = shouldReduceMotion ? 1 : 0.98;

    return (
      <motion.button
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnterEvent}
        onMouseLeave={handleMouseLeaveEvent}
        whileHover={shouldReduceMotion ? {} : { y: hoverY, scale: hoverScale }}
        whileTap={shouldReduceMotion ? {} : { scale: pressScale }}
        transition={{
          y: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.12, ease: 'easeOut' },
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
          letterSpacing: '-0.2px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 250ms ease, border-color 250ms ease, color 250ms ease, box-shadow 250ms ease',
          ...getVariantStyles(),
          ...getSizeStyles(),
          ...style,
        }}
        className={`focus-ring-outline ${className}`}
        {...props}
      >
        {renderSpotlight()}

        {/* Text and arrow container */}
        <span 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transform: isHovered && !shouldReduceMotion ? 'translateX(1px)' : 'none',
            transition: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: isHovered ? 'transform' : 'auto',
          }}
        >
          {children}
        </span>

        {/* Inline Underline for Link variation */}
        {variant === 'link' && (
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: '#ffffff',
              transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin: 'left',
              transition: 'transform 250ms ease',
            }}
          />
        )}

        {/* Unified Premium Arrow navigation */}
        {showArrow && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              marginLeft: size === 'sm' ? '8px' : '12px',
              transform: isHovered && !shouldReduceMotion
                ? `translateX(5px) rotate(${arrowDirection === 'up-right' ? '2deg' : '0deg'}) scale(1.1)`
                : 'translateX(0px) scale(1)',
              transition: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: isHovered ? 'transform' : 'auto',
            }}
          >
            <ArrowIcon size={size === 'sm' ? 16 : 18} strokeWidth={2} />
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
