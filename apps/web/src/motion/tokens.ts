/**
 * FIC Business Hub – Centralized Motion Tokens
 * Built for Motion for React (https://motion.dev/docs/react)
 * Premium SaaS animation system with physics-based springs and micro-interactions
 */

export const motionEasing = {
  /** Smooth luxurious deceleration curve */
  premium: [0.22, 1, 0.36, 1] as const,
  /** Fast out, gentle settle */
  easeOutCubic: [0.33, 1, 0.68, 1] as const,
  /** High-end editorial curve */
  editorial: [0.16, 1, 0.3, 1] as const,
  /** Symmetric smooth ease */
  easeInOut: [0.4, 0, 0.2, 1] as const
};

export const motionSprings = {
  /** Gentle settling spring for cards, headers, and modals */
  gentle: {
    type: 'spring' as const,
    stiffness: 140,
    damping: 18,
    mass: 1
  },
  /** Snappy and tactile response for buttons, tabs, pills, and toggles */
  snappy: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 28,
    mass: 0.8
  },
  /** Playful micro-interaction spring for badges and icons */
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
    mass: 0.9
  },
  /** High-inertia physical spring for large panels and drawers */
  drawer: {
    type: 'spring' as const,
    stiffness: 220,
    damping: 26,
    mass: 1.1
  },
  /** Smooth card tilt and hover recovery */
  cardHover: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30
  }
};

export const motionDurations = {
  instant: 0.15,
  fast: 0.25,
  normal: 0.4,
  slow: 0.7,
  pageTransition: 0.3
};

export const motionStaggers = {
  tight: 0.04,
  normal: 0.08,
  relaxed: 0.12
};
