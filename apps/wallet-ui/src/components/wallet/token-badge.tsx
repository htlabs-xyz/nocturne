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
