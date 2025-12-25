import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../ui/card';
import { TokenBadge } from './token-badge';

interface BalanceCardProps {
  type: 'night' | 'dust';
  balance: number;
  symbol: string;
  fiatValue?: number;
  change24h?: number;
  className?: string;
}

export function BalanceCard({
  type,
  balance,
  symbol,
  fiatValue,
  change24h,
  className,
}: BalanceCardProps) {
  const isPositive = change24h && change24h >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className={clsx('', className)}>
      <div className="flex items-start justify-between mb-3">
        <TokenBadge type={type} />
        {change24h !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-sm',
            isPositive ? 'text-dust' : 'text-red-400'
          )}>
            <TrendIcon size={14} />
            <span>{isPositive ? '+' : ''}{change24h.toFixed(2)}%</span>
          </div>
        )}
      </div>

      <div className="mb-1">
        <span className="text-2xl font-heading font-bold text-midnight-50">
          {balance.toLocaleString()}
        </span>
        <span className="text-lg text-midnight-400 ml-2">{symbol}</span>
      </div>

      {fiatValue !== undefined && (
        <p className="text-sm text-midnight-400">
          ≈ ${fiatValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </p>
      )}
    </Card>
  );
}
