# Phase 02: Design System

## Objective

Build foundational UI components and establish design patterns for Midnight wallet.

## Component Library Structure

```
src/components/
├── ui/                     # Atomic UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── progress-bar.tsx
│   ├── tooltip.tsx
│   ├── modal.tsx
│   └── index.ts
├── wallet/                 # Wallet-specific components
│   ├── address-display.tsx
│   ├── balance-card.tsx
│   ├── token-badge.tsx
│   ├── dust-capacity-bar.tsx
│   ├── privacy-indicator.tsx
│   ├── transaction-item.tsx
│   └── index.ts
└── layout/                 # Layout components (Phase 03)
```

## Implementation Steps

### Step 1: Button Component

```tsx
// src/components/ui/button.tsx
import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-night text-midnight-900 hover:bg-night-light',
  secondary: 'bg-midnight-700 text-midnight-100 hover:bg-midnight-600',
  ghost: 'bg-transparent text-midnight-300 hover:bg-midnight-800 hover:text-midnight-100',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-night/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

### Step 2: Card Component

```tsx
// src/components/ui/card.tsx
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
        variant === 'glass' && 'bg-midnight-800/50 backdrop-blur-glass border border-midnight-700/50',
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
```

### Step 3: Input Component

```tsx
// src/components/ui/input.tsx
import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-midnight-300 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-4 py-2.5 rounded-lg',
            'bg-midnight-900 border border-midnight-600',
            'text-midnight-100 placeholder:text-midnight-500',
            'focus:outline-none focus:ring-2 focus:ring-night/50 focus:border-night',
            'transition-colors duration-200',
            error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
            className
          )}
          {...props}
        />
        {(error || hint) && (
          <p className={clsx('mt-1.5 text-sm', error ? 'text-red-400' : 'text-midnight-400')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
```

### Step 4: Badge Component

```tsx
// src/components/ui/badge.tsx
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
```

### Step 5: Progress Bar Component

```tsx
// src/components/ui/progress-bar.tsx
import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'default' | 'night' | 'shield' | 'dust';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: 'bg-midnight-400',
  night: 'bg-night',
  shield: 'bg-shield',
  dust: 'bg-dust',
};

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max,
  variant = 'default',
  showLabel = false,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full bg-midnight-700 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out', variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-midnight-400">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
```

### Step 6: Token Badge Component (Wallet-Specific)

```tsx
// src/components/wallet/token-badge.tsx
import { clsx } from 'clsx';
import { Coins, Shield, Zap } from 'lucide-react';

type TokenType = 'night' | 'shield' | 'dust';

interface TokenBadgeProps {
  type: TokenType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const tokenConfig: Record<TokenType, { icon: typeof Coins; label: string; colors: string }> = {
  night: {
    icon: Coins,
    label: 'NIGHT',
    colors: 'bg-night/20 text-night border-night/30',
  },
  shield: {
    icon: Shield,
    label: 'Shield',
    colors: 'bg-shield/20 text-shield-light border-shield/30',
  },
  dust: {
    icon: Zap,
    label: 'DUST',
    colors: 'bg-dust/20 text-dust-light border-dust/30',
  },
};

const sizeStyles = {
  sm: { badge: 'px-2 py-0.5 text-xs gap-1', icon: 12 },
  md: { badge: 'px-3 py-1 text-sm gap-1.5', icon: 14 },
  lg: { badge: 'px-4 py-1.5 text-base gap-2', icon: 16 },
};

export function TokenBadge({ type, size = 'md', showLabel = true, className }: TokenBadgeProps) {
  const config = tokenConfig[type];
  const sizeConfig = sizeStyles[size];
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border',
        config.colors,
        sizeConfig.badge,
        className
      )}
    >
      <Icon size={sizeConfig.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
```

### Step 7: Address Display Component

```tsx
// src/components/wallet/address-display.tsx
import { useState } from 'react';
import { clsx } from 'clsx';
import { Copy, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { TokenBadge } from './token-badge';

type AddressType = 'night' | 'shield' | 'dust';

interface AddressDisplayProps {
  address: string;
  type: AddressType;
  label?: string;
  isHidden?: boolean;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}

function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function AddressDisplay({
  address,
  type,
  label,
  isHidden: initialHidden = type === 'shield',
  showCopy = true,
  showExplorer = false,
  className,
}: AddressDisplayProps) {
  const [isHidden, setIsHidden] = useState(initialHidden);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayAddress = isHidden ? '••••••••••••••••••••' : truncateAddress(address);

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <TokenBadge type={type} size="sm" showLabel={false} />

      <div className="flex-1 min-w-0">
        {label && <p className="text-xs text-midnight-400 mb-0.5">{label}</p>}
        <p className="font-mono text-sm text-midnight-200 truncate">{displayAddress}</p>
      </div>

      <div className="flex items-center gap-1">
        {type === 'shield' && (
          <button
            onClick={() => setIsHidden(!isHidden)}
            className="p-1.5 text-midnight-400 hover:text-midnight-200 transition-colors"
            title={isHidden ? 'Show address' : 'Hide address'}
          >
            {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}

        {showCopy && (
          <button
            onClick={handleCopy}
            className="p-1.5 text-midnight-400 hover:text-midnight-200 transition-colors"
            title="Copy address"
          >
            {copied ? <Check size={16} className="text-dust" /> : <Copy size={16} />}
          </button>
        )}

        {showExplorer && type !== 'shield' && (
          <button
            onClick={() => window.open(`https://explorer.midnight.network/address/${address}`, '_blank')}
            className="p-1.5 text-midnight-400 hover:text-midnight-200 transition-colors"
            title="View on explorer"
          >
            <ExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
```

### Step 8: DUST Capacity Bar Component

```tsx
// src/components/wallet/dust-capacity-bar.tsx
import { clsx } from 'clsx';
import { Zap, TrendingUp } from 'lucide-react';
import { ProgressBar } from '../ui/progress-bar';

interface DustCapacityBarProps {
  current: number;
  max: number;
  generationRate: number;
  status: 'active' | 'paused' | 'decaying';
  className?: string;
}

const statusConfig = {
  active: { label: 'Generating', color: 'text-dust', icon: TrendingUp },
  paused: { label: 'Paused', color: 'text-midnight-400', icon: Zap },
  decaying: { label: 'Decaying', color: 'text-yellow-500', icon: Zap },
};

export function DustCapacityBar({
  current,
  max,
  generationRate,
  status,
  className,
}: DustCapacityBarProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const percentage = (current / max) * 100;

  return (
    <div className={clsx('p-4 rounded-xl bg-midnight-800 border border-midnight-700', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-dust" />
          <span className="font-heading font-semibold text-midnight-100">DUST Capacity</span>
        </div>
        <div className={clsx('flex items-center gap-1 text-sm', config.color)}>
          <StatusIcon size={14} />
          <span>{config.label}</span>
        </div>
      </div>

      <ProgressBar value={current} max={max} variant="dust" size="lg" className="mb-3" />

      <div className="flex justify-between text-sm">
        <div>
          <span className="text-dust-light font-semibold">{current.toLocaleString()}</span>
          <span className="text-midnight-400"> / {max.toLocaleString()} DUST</span>
        </div>
        <div className="text-midnight-400">
          +{generationRate}/day
        </div>
      </div>
    </div>
  );
}
```

### Step 9: Privacy Indicator Component

```tsx
// src/components/wallet/privacy-indicator.tsx
import { clsx } from 'clsx';
import { Shield, Eye } from 'lucide-react';

interface PrivacyIndicatorProps {
  isPrivate: boolean;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function PrivacyIndicator({
  isPrivate,
  size = 'md',
  showLabel = true,
  className,
}: PrivacyIndicatorProps) {
  const Icon = isPrivate ? Shield : Eye;
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        isPrivate
          ? 'bg-shield/20 text-shield-light border border-shield/30'
          : 'bg-midnight-700 text-midnight-300 border border-midnight-600',
        className
      )}
    >
      <Icon size={iconSize} />
      {showLabel && <span>{isPrivate ? 'Private' : 'Public'}</span>}
    </div>
  );
}
```

### Step 10: Export Index Files

```tsx
// src/components/ui/index.ts
export { Button } from './button';
export { Card, CardHeader, CardTitle, CardContent } from './card';
export { Input } from './input';
export { Badge } from './badge';
export { ProgressBar } from './progress-bar';
```

```tsx
// src/components/wallet/index.ts
export { TokenBadge } from './token-badge';
export { AddressDisplay } from './address-display';
export { DustCapacityBar } from './dust-capacity-bar';
export { PrivacyIndicator } from './privacy-indicator';
```

## Type Definitions

```tsx
// src/types/wallet.ts
export type AddressType = 'night' | 'shield' | 'dust';
export type TransactionType = 'send' | 'receive' | 'generation';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type DustStatus = 'active' | 'paused' | 'decaying';

export interface WalletAddress {
  address: string;
  type: AddressType;
  label?: string;
}

export interface TokenBalance {
  night: number;
  nightUsd: number;
  dust: number;
  dustMax: number;
  dustGenerationRate: number;
  dustStatus: DustStatus;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  tokenType: 'night' | 'dust';
  amount: number;
  from?: string;
  to?: string;
  timestamp: Date;
  status: TransactionStatus;
  hash: string;
  isPrivate: boolean;
}
```

## Verification

```bash
bun run typecheck
bun run dev
# Manually verify components render correctly in App.tsx test page
```

## Output

- Complete atomic UI component library
- Wallet-specific components (address, tokens, DUST)
- Type definitions for wallet domain
- Consistent design tokens usage
