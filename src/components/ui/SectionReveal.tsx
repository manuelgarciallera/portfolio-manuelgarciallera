'use client';

import { useEffect, useRef, HTMLAttributes } from 'react';

type RevealVariant = 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale';

interface SectionRevealProps extends HTMLAttributes<HTMLDivElement> {
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
}

const variantStyles: Record<RevealVariant, { hidden: string; visible: string }> = {
  'fade-up': { hidden: 'opacity-0 translate-y-10', visible: 'opacity-100 translate-y-0' },
  'fade-in': { hidden: 'opacity-0', visible: 'opacity-100' },
  'slide-left': { hidden: 'opacity-0 -translate-x-8', visible: 'opacity-100 translate-x-0' },
  'slide-right': { hidden: 'opacity-0 translate-x-8', visible: 'opacity-100 translate-x-0' },
  scale: { hidden: 'opacity-0 scale-95', visible: 'opacity-100 scale-100' },
};

export function SectionReveal({
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.15,
  once = true,
  children,
  className = '',
  ...props
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { hidden, visible } = variantStyles[variant];
    hidden.split(' ').forEach((cls) => el.classList.add(cls));
    el.style.transition = `opacity ${duration}ms cubic-bezier(.16,1,.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(.16,1,.3,1) ${delay}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hidden.split(' ').forEach((cls) => el.classList.remove(cls));
            visible.split(' ').forEach((cls) => el.classList.add(cls));
            if (once) observer.unobserve(el);
          } else if (!once) {
            visible.split(' ').forEach((cls) => el.classList.remove(cls));
            hidden.split(' ').forEach((cls) => el.classList.add(cls));
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [variant, delay, duration, threshold, once]);

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
}
