'use client';

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'blue' | 'social';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDark?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  href?: string;
}

type ButtonProps = ButtonBaseProps &
  (ButtonHTMLAttributes<HTMLButtonElement> | AnchorHTMLAttributes<HTMLAnchorElement>);

const sizeMap: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px]',
  md: 'px-6 py-3 text-[15px]',
  lg: 'px-8 py-4 text-[17px]',
};

function getVariantClasses(variant: ButtonVariant, isDark: boolean): string {
  switch (variant) {
    case 'primary':
      return isDark ? 'btn-dk' : 'btn-lt';
    case 'secondary':
      return isDark ? 'btn-ghost-dk' : 'btn-ghost-lt';
    case 'ghost':
      return 'bg-transparent border border-[var(--divider)] text-[var(--text)] hover:bg-white/5';
    case 'blue':
      return 'btn-blue';
    case 'social':
      return isDark ? 'btn-social' : 'btn-social-lt';
    default:
      return 'btn-dk';
  }
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isDark = true,
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      href,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantClasses = getVariantClasses(variant, isDark);
    const sizeClasses = sizeMap[size];
    const widthClass = fullWidth ? 'w-full' : '';

    const baseClasses = [
      'inline-flex items-center justify-center gap-2 rounded-full font-medium',
      'cursor-pointer select-none no-underline transition-all duration-200',
      variantClasses,
      sizeClasses,
      widthClass,
      isLoading ? 'pointer-events-none opacity-60' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <>
        {isLoading && (
          <svg className="-ml-1 mr-1 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    );

    if (href) {
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          className={baseClasses}
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        className={baseClasses}
        disabled={isLoading}
        {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
