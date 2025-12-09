interface TokenIconProps {
  symbol: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-8 h-8 text-base',
  lg: 'w-10 h-10 text-lg',
};

const tokenColors: Record<string, string> = {
  NIGHT: 'from-purple-600 to-indigo-800',
  tDUST: 'from-amber-500 to-orange-600',
  DEFAULT: 'from-gray-600 to-gray-700',
};

export function TokenIcon({ symbol, icon, size = 'md', className = '' }: TokenIconProps) {
  const gradient = tokenColors[symbol] || tokenColors.DEFAULT;

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-medium text-white ${sizes[size]} ${className}`}
    >
      {icon || symbol.charAt(0)}
    </div>
  );
}
