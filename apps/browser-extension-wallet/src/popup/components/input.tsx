import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-text-secondary mb-1.5">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full bg-midnight-700 border border-midnight-500 rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple transition-colors ${error ? 'border-accent-red' : ''} ${rightElement ? 'pr-12' : ''} ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-accent-red mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
