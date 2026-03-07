'use client';

import { HTMLAttributes } from 'react';

type TagVariant = 'default' | 'teal' | 'outline' | 'filled';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  isDark?: boolean;
}

const variantMap: Record<TagVariant, (isDark: boolean) => string> = {
  default: (isDark) =>
    isDark
      ? 'bg-white/[0.08] text-white/60 border border-white/10'
      : 'bg-black/[0.06] text-black/50 border border-black/10',
  teal: () => 'bg-[#5ec4c8]/15 text-[#5ec4c8] border border-[#5ec4c8]/20',
  outline: (isDark) =>
    isDark ? 'border border-white/20 text-white/70' : 'border border-black/15 text-black/60',
  filled: (isDark) =>
    isDark ? 'bg-white/15 text-white border-transparent' : 'bg-black/10 text-black border-transparent',
};

export function Tag({ variant = 'default', isDark = true, children, className = '', ...props }: TagProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide',
        variantMap[variant](isDark),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
