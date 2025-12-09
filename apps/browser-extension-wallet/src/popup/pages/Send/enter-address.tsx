import { useState } from 'react';
import { Button, Input } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { sanitizeAddress } from '../../utils/sanitize';

export function EnterAddress() {
  const { setRoute, setSendAddress, goBack } = useUIStore();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const validateAddress = (addr: string) => {
    return addr.startsWith('mn_') && addr.length >= 20 && addr.length <= 100;
  };

  const handleAddressChange = (value: string) => {
    const sanitized = sanitizeAddress(value);
    setAddress(sanitized);
    setError('');
  };

  const handleContinue = () => {
    if (!validateAddress(address)) {
      setError('Invalid Midnight address');
      return;
    }
    setSendAddress(address);
    setRoute('send-confirm');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleAddressChange(text);
    } catch {
      setError('Failed to read clipboard');
    }
  };

  return (
    <div className="flex flex-col h-full bg-midnight-900">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-midnight-600">
        <button
          onClick={goBack}
          className="p-1 text-text-secondary hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white">Recipient</h1>
      </header>

      <main className="flex-1 p-4">
        <p className="text-text-secondary text-sm mb-4">
          Enter the recipient&apos;s Midnight address
        </p>

        <Input
          label="Address"
          placeholder="mn_shield1..."
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          error={error}
          rightElement={
            <button
              onClick={handlePaste}
              className="text-xs text-accent-purple font-medium hover:text-accent-purple-hover transition-colors"
            >
              PASTE
            </button>
          }
        />

        <div className="mt-4 bg-midnight-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-accent-purple flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-text-muted text-xs">
              Make sure the address is correct. Transactions cannot be reversed once confirmed.
            </p>
          </div>
        </div>
      </main>

      <div className="p-4">
        <Button fullWidth onClick={handleContinue} disabled={!address}>
          Review Transaction
        </Button>
      </div>
    </div>
  );
}
