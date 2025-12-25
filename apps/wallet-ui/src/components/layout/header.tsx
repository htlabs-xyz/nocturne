import { clsx } from 'clsx';
import { ChevronDown, Globe, Bell } from 'lucide-react';
import { Badge } from '../ui/badge';

interface HeaderProps {
  walletName?: string;
  network?: 'mainnet' | 'testnet';
  className?: string;
}

export function Header({ walletName = 'My Wallet', network = 'testnet', className }: HeaderProps) {
  return (
    <header
      className={clsx(
        'h-16 px-6 flex items-center justify-between',
        'bg-midnight-800/50 border-b border-midnight-700/50',
        className
      )}
    >
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-midnight-700/50 transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-shield to-night flex items-center justify-center">
          <span className="text-sm font-bold text-midnight-900">
            {walletName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="font-semibold text-midnight-100">{walletName}</span>
        <ChevronDown size={16} className="text-midnight-400" />
      </button>

      <div className="flex items-center gap-4">
        <Badge
          variant={network === 'mainnet' ? 'success' : 'warning'}
          className="flex items-center gap-1.5"
        >
          <Globe size={12} />
          {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </Badge>

        <button className="relative p-2 text-midnight-400 hover:text-midnight-200 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-night rounded-full" />
        </button>
      </div>
    </header>
  );
}
