import type { Variants } from 'motion/react';
import { motionEasing, motionSprings, motionDurations, motionStaggers } from './tokens';

/**
 * Standard Fade In
 */
export const fadeIn: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasing.premium
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.easeInOut
    }
  }
};

/**
 * Fade Up (Vertical Entrance)
 */
export const fadeUp: Variants = {
  initial: {
    opacity: 0,
    y: 18
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasing.premium
    }
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.easeInOut
    }
  }
};

/**
 * Fade Down (Header / Dropdown Reveal)
 */
export const fadeDown: Variants = {
  initial: {
    opacity: 0,
    y: -16
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasing.premium
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.easeInOut
    }
  }
};

/**
 * Slide Left (Entrance from right towards left)
 */
export const slideLeft: Variants = {
  initial: {
    opacity: 0,
    x: 28
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasing.premium
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.easeInOut
    }
  }
};

/**
 * Slide Right (Entrance from left towards right)
 */
export const slideRight: Variants = {
  initial: {
    opacity: 0,
    x: -28
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasing.premium
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.easeInOut
    }
  }
};

/**
 * Scale In (Micro-interaction & Pill/Badge Entrance)
 */
export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.92
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: motionSprings.snappy
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.easeInOut
    }
  }
};

/**
 * Blur Reveal (High-end Hero & Section Entrance)
 */
export const blurReveal: Variants = {
  initial: {
    opacity: 0,
    filter: 'blur(8px)',
    y: 14
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      duration: motionDurations.slow,
      ease: motionEasing.editorial
    }
  },
  exit: {
    opacity: 0,
    filter: 'blur(4px)',
    y: -8,
    transition: {
      duration: motionDurations.fast
    }
  }
};

/**
 * Stagger Container (Parent Orchestration)
 */
export const staggerChildren = (staggerDelay = motionStaggers.normal): Variants => ({
  initial: {
    opacity: 1
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1
    }
  }
});

export const staggerContainer: Variants = staggerChildren();

/**
 * Stagger Item (Child in a list or grid)
 */
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 16,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: motionDurations.normal,
      ease: motionEasing.premium
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: motionDurations.fast
    }
  }
};

/**
 * Spring Entrance (Physics-driven for KPI & Feature Cards)
 */
export const springEntrance: Variants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.96
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: motionSprings.gentle
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: motionDurations.fast
    }
  }
};

/**
 * Modal Backdrop & Card Variants
 */
export const modalBackdrop: Variants = {
  initial: {
    opacity: 0,
    backdropFilter: 'blur(0px)'
  },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.premium
    }
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.easeInOut
    }
  }
};

export const modalEntrance: Variants = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 16
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: motionSprings.snappy
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    transition: {
      duration: motionDurations.fast,
      ease: motionEasing.easeInOut
    }
  }
};

/**
 * Page Transitions (Zero white flash, smooth cross-route motion)
 */
export const pageEnter: Variants = {
  initial: {
    opacity: 0,
    y: 8
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurations.pageTransition,
      ease: motionEasing.premium
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: motionDurations.instant,
      ease: motionEasing.easeInOut
    }
  }
};

/**
 * Scroll Reveal Variant for on-scroll viewport intersections
 */
export const scrollReveal: Variants = {
  initial: {
    opacity: 0,
    y: 30
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurations.slow,
      ease: motionEasing.premium
    }
  }
};
