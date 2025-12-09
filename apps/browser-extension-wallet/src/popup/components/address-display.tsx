import { useState } from 'react';

interface AddressDisplayProps {
  address: string;
  truncate?: boolean;
  copyable?: boolean;
  className?: string;
}

function truncateAddress(address: string, start = 8, end = 6): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function AddressDisplay({
  address,
  truncate = true,
  copyable = true,
  className = '',
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayAddress = truncate ? truncateAddress(address) : address;

  return (
    <div
      className={`flex items-center gap-2 font-mono text-sm ${className}`}
      onClick={copyable ? handleCopy : undefined}
    >
      <span className={copyable ? 'cursor-pointer hover:text-white transition-colors' : ''}>
        {displayAddress}
      </span>
      {copyable && (
        <button className="text-text-muted hover:text-white transition-colors">
          {copied ? (
            <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
