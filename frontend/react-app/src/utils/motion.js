export const pageTransition = {
  initial: { opacity: 0, y: 22, scale: 0.988, filter: 'blur(12px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, scale: 0.992, filter: 'blur(8px)' },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
};

export const staggerParent = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.08
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 24, scale: 0.982, filter: 'blur(10px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
  }
};

export const floatingCard = {
  rest: { y: 0, scale: 1, rotateX: 0, rotateY: 0 },
  hover: {
    y: -8,
    scale: 1.015,
    rotateX: -1,
    rotateY: 1,
    transition: { duration: 0.22, ease: 'easeOut' }
  }
};

export const revealPanel = {
  initial: { opacity: 0, y: 28, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] }
  }
};
