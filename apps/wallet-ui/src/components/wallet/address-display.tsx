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
