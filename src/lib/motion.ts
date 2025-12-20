// Shared motion configurations for consistent animations across the app
import { Variants } from "framer-motion";

// Fade in from below - perfect for cards and content sections
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

// Stagger children animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.03,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

// Scale in - great for interactive elements
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

// Slide in from side
export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

// Hover effects for interactive elements
export const hoverScale = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  tap: { scale: 0.98, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } }
};

export const hoverLift = {
  rest: { y: 0 },
  hover: {
    y: -4,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  }
};

// Button press animation
export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
};

// Card hover effect with shadow
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
  },
  hover: {
    scale: 1.015,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
  }
};

// Smooth entrance for modals/dialogs
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  }
};

// List item stagger animation
export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

// Page transition - smoother
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.04
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
  }
};

// Smooth fade in for components
export const smoothFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

// Smooth scale fade for cards
export const cardFadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

