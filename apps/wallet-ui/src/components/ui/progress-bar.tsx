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
