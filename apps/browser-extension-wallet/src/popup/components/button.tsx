import { Spinner } from './spinner';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  onClick,
  disabled,
  fullWidth,
  type = 'button',
  className = '',
}: ButtonProps) {
  const base = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-accent-purple hover:bg-accent-purple-hover text-white',
    secondary: 'bg-midnight-600 hover:bg-midnight-500 text-white',
    ghost: 'bg-transparent hover:bg-midnight-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledStyles = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${widthStyles} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
}
