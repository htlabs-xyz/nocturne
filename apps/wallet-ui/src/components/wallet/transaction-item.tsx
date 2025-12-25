import { clsx } from 'clsx';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Zap } from 'lucide-react';
import { PrivacyIndicator } from './privacy-indicator';

type TransactionType = 'send' | 'receive' | 'swap' | 'dust-generation';
type TransactionStatus = 'pending' | 'confirmed' | 'failed';

interface TransactionItemProps {
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  symbol: string;
  isPrivate: boolean;
  address?: string;
  timestamp: Date;
  onClick?: () => void;
  className?: string;
}

const typeConfig: Record<TransactionType, { icon: typeof ArrowUpRight; label: string; color: string }> = {
  send: { icon: ArrowUpRight, label: 'Sent', color: 'text-red-400' },
  receive: { icon: ArrowDownLeft, label: 'Received', color: 'text-dust' },
  swap: { icon: RefreshCw, label: 'Swapped', color: 'text-night' },
  'dust-generation': { icon: Zap, label: 'Generated', color: 'text-dust' },
};

const statusStyles: Record<TransactionStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-dust/20 text-dust',
  failed: 'bg-red-500/20 text-red-400',
};

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

export function TransactionItem({
  type,
  status,
  amount,
  symbol,
  isPrivate,
  address,
  timestamp,
  onClick,
  className,
}: TransactionItemProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 p-3 rounded-xl',
        'hover:bg-midnight-800/50 transition-colors text-left',
        className
      )}
    >
      <div className={clsx(
        'w-10 h-10 rounded-full flex items-center justify-center',
        'bg-midnight-700'
      )}>
        <Icon size={18} className={config.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-midnight-100">{config.label}</span>
          <PrivacyIndicator isPrivate={isPrivate} size="sm" showLabel={false} />
          <span className={clsx('px-1.5 py-0.5 rounded text-xs', statusStyles[status])}>
            {status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-midnight-400">
          {address && <span className="font-mono">{truncateAddress(address)}</span>}
          <span>•</span>
          <span>{formatTime(timestamp)}</span>
        </div>
      </div>

      <div className="text-right">
        <span className={clsx('font-medium', config.color)}>
          {type === 'send' ? '-' : '+'}{amount.toLocaleString()} {symbol}
        </span>
      </div>
    </button>
  );
}
