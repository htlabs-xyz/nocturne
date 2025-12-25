import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'night' | 'shield' | 'dust' | 'success' | 'warning' | 'error';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-midnight-700 text-midnight-300',
  night: 'bg-night/20 text-night border border-night/30',
  shield: 'bg-shield/20 text-shield-light border border-shield/30',
  dust: 'bg-dust/20 text-dust-light border border-dust/30',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
