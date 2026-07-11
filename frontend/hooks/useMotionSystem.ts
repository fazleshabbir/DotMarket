import { useReducedMotion, Variants } from 'framer-motion';

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
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  // SUBTITLE REVEAL
  const revealSubtitle: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 18,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.15,
        ease: 'easeOut',
      },
    },
  };

  // CARD REVEAL (intended for staggered children)
  const revealCard: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 40,
      scale: shouldReduceMotion ? 1 : 0.96,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.55,
        ease: 'easeOut',
      },
    },
  };

  // BUTTONS REVEAL
  const revealButton: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
      scale: shouldReduceMotion ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
      },
    },
  };

  // FADE UP
  const fadeUp: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 24,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
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
      },
    },
  };

  // STAGGER CONTAINER
  const staggerContainer = (staggerDelay = 0.1): Variants => ({
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
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  // FLOATING ICON KEYFRAMES (returns animation object or static based on reduced motion)
  const getFloatingAnimation = (baseDelay = 0): any => {
    if (shouldReduceMotion) return {};
    return {
      y: [0, -4, 0],
      transition: {
        duration: 4 + Math.random() * 2, // 4-6s
        repeat: Infinity,
        ease: 'easeInOut' as const,
        delay: baseDelay + Math.random() * 0.5,
      },
    };
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
    getFloatingAnimation,
    shouldReduceMotion,
  };
}
