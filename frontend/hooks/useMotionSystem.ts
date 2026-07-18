import { useReducedMotion, Variants } from 'framer-motion';

// Premium Apple/Linear-style easing curve
const CUBIC_BEZIER: [number, number, number, number] = [0.16, 1, 0.3, 1];
const BASE_DURATION = 0.6;

// Standardized viewport config to prevent scroll-jank and repeated calculations
export const VIEWPORT_SETTINGS = { once: true, margin: '0px 0px 200px 0px', amount: 0.01 };

export function useMotionSystem() {
  const shouldReduceMotion = !!useReducedMotion();

  // HEADING REVEAL
  const revealHeading: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 24,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: BASE_DURATION,
        ease: CUBIC_BEZIER,
      },
    },
  };

  // SUBTITLE REVEAL
  const revealSubtitle: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: BASE_DURATION,
        delay: 0.05, // Snappier delay
        ease: CUBIC_BEZIER,
      },
    },
  };

  // CARD REVEAL (intended for staggered children)
  const revealCard: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 30,
      scale: shouldReduceMotion ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: BASE_DURATION,
        ease: CUBIC_BEZIER,
      },
    },
  };

  // BUTTONS REVEAL
  const revealButton: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 10,
      scale: shouldReduceMotion ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: CUBIC_BEZIER,
      },
    },
  };

  // FADE UP
  const fadeUp: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: BASE_DURATION,
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
        duration: 0.4,
        ease: 'linear', // Pure fades are best linear or easeOut
      },
    },
  };

  // STAGGER CONTAINER (Strict, unified stagger delays)
  const staggerContainer = (staggerDelay = 0.06): Variants => ({
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
      },
    },
  });

  const staggerItem: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 15,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: BASE_DURATION,
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
  };
}
