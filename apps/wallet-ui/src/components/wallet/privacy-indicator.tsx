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
