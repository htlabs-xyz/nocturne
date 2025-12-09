import { useState, useMemo } from 'react';
import { Button, Input } from '../../components';
import { useUIStore } from '../../stores/ui-store';

const COMMON_PASSWORDS = [
  'password', '12345678', '123456789', '1234567890', 'qwerty123',
  'password1', 'password123', 'iloveyou', 'sunshine', 'princess',
];

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('At least 12 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('One number');
  }
  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    errors.push('One special character');
  }
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Cannot be a common password');
  }

  return { valid: errors.length === 0, errors };
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-accent-red' };
  if (score <= 3) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-accent-green' };
}

export function SetPassword() {
  const { setRoute, setOnboarded } = useUIStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validation = useMemo(() => validatePassword(password), [password]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = () => {
    if (!validation.valid) {
      setError('Password does not meet requirements');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setOnboarded(true);
    setRoute('dashboard');
  };

  const toggleVisibility = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-text-muted hover:text-white transition-colors"
    >
      {showPassword ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-midnight-900 p-6">
      <button
        onClick={() => setRoute('seed-phrase')}
        className="self-start p-2 -ml-2 text-text-secondary hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 flex flex-col">
        <h1 className="text-xl font-bold text-white mb-2">Set Password</h1>
        <p className="text-text-secondary text-sm mb-6">
          Create a password to unlock your wallet on this device
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password (12+ chars)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              rightElement={toggleVisibility}
            />
            {password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1 bg-midnight-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${strength.color}`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs ${strength.score <= 1 ? 'text-accent-red' : strength.score <= 3 ? 'text-yellow-500' : 'text-accent-green'}`}>
                    {strength.label}
                  </span>
                </div>
                {!validation.valid && (
                  <ul className="text-xs text-text-muted space-y-0.5">
                    {validation.errors.map((err, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="text-accent-red">•</span> {err}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            error={error}
          />
        </div>

        <div className="bg-midnight-700 rounded-xl p-4">
          <p className="text-text-muted text-xs">
            This password is used to unlock your wallet on this device only. It cannot be used to recover your wallet.
          </p>
        </div>
      </div>

      <Button
        fullWidth
        onClick={handleSubmit}
        disabled={!password || !confirmPassword}
      >
        Create Wallet
      </Button>
    </div>
  );
}
