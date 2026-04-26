import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export function BorderTrail({
  className,
  size = 60,
  transition,
  onAnimationComplete,
  style,
}) {
  const defaultTransition = {
    repeat: Infinity,
    duration: 5,
    ease: 'linear',
  };

  return (
    <div className='border-trail-mask'>
      <motion.div
        className={cn('border-trail-chip', className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          ...style,
        }}
        animate={{
          offsetDistance: ['0%', '100%'],
        }}
        transition={transition || defaultTransition}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}
