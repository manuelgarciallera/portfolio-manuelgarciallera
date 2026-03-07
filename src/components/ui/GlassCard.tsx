'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  blur?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  shimmer?: boolean;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const blurMap = {
  sm: 'backdrop-blur-[20px]',
  md: 'backdrop-blur-[40px]',
  lg: 'backdrop-blur-[60px]',
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      blur = 'md',
      bordered = true,
      shimmer = true,
      hoverable = false,
      padding = 'md',
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const classes = [
      'relative rounded-[20px]',
      blurMap[blur],
      bordered ? 'border border-white/10' : '',
      hoverable ? 'cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_80px_rgba(0,0,0,0.4)]' : '',
      paddingMap[padding],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={classes}
        style={{
          background: 'var(--glass)',
          boxShadow: '0 0 0 0.5px rgba(255,255,255,0.07) inset, 0 32px 64px rgba(0,0,0,0.28), 0 8px 16px rgba(0,0,0,0.18)',
          ...style,
        }}
        {...props}
      >
        {shimmer && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)',
            }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
