'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/motion';

/**
 * AnimatedPage — wraps inner page content with staggered entrance.
 * Children appear with fadeUp + stagger.
 * Respects prefers-reduced-motion.
 */
export default function AnimatedPage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
