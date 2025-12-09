import { useState } from 'react';
import { Button, Input } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { useWalletStore } from '../../stores/wallet-store';

export function Unlock() {
  const [password, setPassword] = useState('');
  const { unlock, isLoading, error, clearError } = useWalletStore();
  const setRoute = useUIStore((s) => s.setRoute);

  const handleUnlock = async () => {
    try {
      await unlock(password);
      setRoute('dashboard');
    } catch {
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.length >= 8) {
      handleUnlock();
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-center mb-8">
          Enter your password to unlock your wallet
        </p>

        <div className="w-full space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            onKeyPress={handleKeyPress}
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <Button
            onClick={handleUnlock}
            disabled={password.length < 8 || isLoading}
            className="w-full"
          >
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </div>
      </div>
    </div>
  );
}
