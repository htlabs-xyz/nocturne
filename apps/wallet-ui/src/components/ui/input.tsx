import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-midnight-300 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-4 py-2.5 rounded-lg',
            'bg-midnight-900 border border-midnight-600',
            'text-midnight-100 placeholder:text-midnight-500',
            'focus:outline-none focus:ring-2 focus:ring-night/50 focus:border-night',
            'transition-colors duration-200',
            error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
            className
          )}
          {...props}
        />
        {(error || hint) && (
          <p className={clsx('mt-1.5 text-sm', error ? 'text-red-400' : 'text-midnight-400')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
