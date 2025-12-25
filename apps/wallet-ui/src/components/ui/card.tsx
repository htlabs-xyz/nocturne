import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ className, variant = 'default', padding = 'md', children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl',
        variant === 'default' && 'bg-midnight-800 border border-midnight-700',
        variant === 'glass' && 'bg-midnight-800/50 backdrop-blur-[16px] border border-midnight-700/50',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('font-heading font-semibold text-lg text-midnight-50', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx(className)} {...props}>
      {children}
    </div>
  );
}
