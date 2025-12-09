import { useState } from 'react';
import { Button, Input } from '../../components';
import { useUIStore } from '../../stores/ui-store';

export function ImportWallet() {
  const { setRoute, setPendingSeedPhrase } = useUIStore();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 24) {
      setError('Seed phrase must be 24 words');
      return;
    }
    setPendingSeedPhrase(seedPhrase.trim());
    setRoute('set-password');
  };

  return (
    <div className="flex flex-col h-full bg-midnight-900 p-6">
      <button
        onClick={() => setRoute('welcome')}
        className="self-start p-2 -ml-2 text-text-secondary hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 flex flex-col">
        <h1 className="text-xl font-bold text-white mb-2">Import Wallet</h1>
        <p className="text-text-secondary text-sm mb-6">
          Enter your 24 word seed phrase to restore your wallet
        </p>

        <div className="mb-4">
          <label className="block text-sm text-text-secondary mb-2">Seed Phrase</label>
          <textarea
            className={`w-full h-32 bg-midnight-700 border rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple transition-colors resize-none ${
              error ? 'border-accent-red' : 'border-midnight-500'
            }`}
            placeholder="Enter your seed phrase words separated by spaces..."
            value={seedPhrase}
            onChange={(e) => {
              setSeedPhrase(e.target.value);
              setError('');
            }}
          />
          {error && <p className="text-sm text-accent-red mt-1">{error}</p>}
        </div>

        <div className="bg-midnight-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-accent-purple flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-text-muted text-xs">
              Your seed phrase will be encrypted and stored securely on this device. We never have access to your keys.
            </p>
          </div>
        </div>
      </div>

      <Button fullWidth onClick={handleImport} disabled={!seedPhrase.trim()}>
        Continue
      </Button>
    </div>
  );
}
