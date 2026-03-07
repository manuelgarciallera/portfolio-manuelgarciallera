'use client';

import { HTMLAttributes } from 'react';

type GradientVariant = 'dark' | 'light' | 'brand' | 'teal' | 'neutral';
type GradientTag = 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p';

interface GradientTextProps extends HTMLAttributes<HTMLElement> {
  variant?: GradientVariant;
  as?: GradientTag;
}

const gradientMap: Record<GradientVariant, string> = {
  dark: 'bg-gradient-to-br from-white via-white/90 to-white/50',
  light: 'bg-gradient-to-br from-[#1d1d1f] via-[#1d1d1f]/90 to-[#6e6e73]',
  teal: 'bg-gradient-to-r from-[#5ec4c8] to-[#3da8ac]',
  brand: 'bg-gradient-to-r from-[#00C8FF] via-[#5ec4c8] to-[#FF2D78]',
  neutral: 'bg-gradient-to-br from-[#86868b] to-[#6e6e73]',
};

export function GradientText({ variant = 'dark', as: Tag = 'span', children, className = '', ...props }: GradientTextProps) {
  return (
    <Tag className={[gradientMap[variant], 'inline-block bg-clip-text text-transparent', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </Tag>
  );
}
