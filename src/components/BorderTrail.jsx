import { cn } from '../lib/utils';

export function BorderTrail({
  className,
  size = 60,
  style,
}) {
  return (
    <div className='border-trail-mask'>
      <div
        className={cn('border-trail-chip border-trail-animation', className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          ...style,
        }}
      />
    </div>
  );
}
