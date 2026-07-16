import { useReducedMotion, Variants } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Premium Apple/Linear-style easing curve
const CUBIC_BEZIER: [number, number, number, number] = [0.16, 1, 0.3, 1];
const BASE_DURATION = 0.6;

// Keep static fallback config, but we will primary use the dynamic hook config
export const VIEWPORT_SETTINGS = { once: true, margin: '-5%' };

export function useMotionSystem() {
  const shouldReduceMotion = !!useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Device-aware dynamic viewport settings to prevent visual pop-in or delays on mobile
  const viewport = {
    once: true,
    margin: isMobile ? '-4%' : '-10%',
  };

  // HEADING REVEAL (reduced translation on mobile)
  const revealHeading: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : isMobile ? 12 : 24,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.45 : BASE_DURATION,
        ease: CUBIC_BEZIER,
      },
    },
  };

  // SUBTITLE REVEAL
  const revealSubtitle: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : isMobile ? 8 : 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.45 : BASE_DURATION,
        delay: isMobile ? 0.03 : 0.05,
        ease: CUBIC_BEZIER,
      },
    },
  };

  // CARD REVEAL (No scaling on mobile to optimize GPU composite and texture redraw)
  const revealCard: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : isMobile ? 12 : 30,
      scale: shouldReduceMotion || isMobile ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: isMobile ? 0.45 : BASE_DURATION,
        ease: CUBIC_BEZIER,
      },
    },
  };

  // BUTTONS REVEAL
  const revealButton: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : isMobile ? 6 : 10,
      scale: shouldReduceMotion || isMobile ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: isMobile ? 0.3 : 0.4,
        ease: CUBIC_BEZIER,
      },
    },
  };

  // FADE UP
  const fadeUp: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : isMobile ? 10 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.45 : BASE_DURATION,
        ease: CUBIC_BEZIER,
      },
    },
  };

  // FADE IN
  const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: isMobile ? 0.3 : 0.4,
        ease: 'linear',
      },
    },
  };

  // STAGGER CONTAINER (Halve delays on mobile to ensure fast rendering)
  const staggerContainer = (staggerDelay = 0.06): Variants => ({
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : isMobile ? staggerDelay * 0.5 : staggerDelay,
      },
    },
  });

  const staggerItem: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : isMobile ? 8 : 15,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.45 : BASE_DURATION,
        ease: CUBIC_BEZIER,
      },
    },
  };

  return {
    revealHeading,
    revealSubtitle,
    revealCard,
    revealButton,
    fadeUp,
    fadeIn,
    staggerContainer,
    staggerItem,
    shouldReduceMotion,
    viewport,
  };
}
