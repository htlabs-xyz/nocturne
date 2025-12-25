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
