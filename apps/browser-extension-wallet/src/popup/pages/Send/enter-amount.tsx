import { useState } from 'react';
import { Button, Input, TokenIcon } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { mockTokens } from '../../stores/mock-data';
import { sanitizeAmount } from '../../utils/sanitize';

export function EnterAmount() {
  const { selectedToken, setRoute, setSendAmount, goBack } = useUIStore();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const token = mockTokens.find((t) => t.symbol === selectedToken);
  const maxBalance = token?.balance || '0';

  const handleMax = () => {
    setAmount(maxBalance);
  };

  const handleAmountChange = (value: string) => {
    const sanitized = sanitizeAmount(value);
    setAmount(sanitized);
    setError('');
  };

  const handleContinue = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (numAmount > parseFloat(maxBalance)) {
      setError('Insufficient balance');
      return;
    }
    setSendAmount(amount);
    setRoute('send-address');
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
        <h1 className="text-lg font-semibold text-white">Enter Amount</h1>
      </header>

      <main className="flex-1 p-4">
        <div className="flex items-center gap-3 mb-6">
          {token && <TokenIcon symbol={token.symbol} icon={token.icon} size="lg" />}
          <div>
            <p className="text-white font-medium">{selectedToken}</p>
            <p className="text-text-muted text-sm">Balance: {maxBalance}</p>
          </div>
        </div>

        <div className="mb-4">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            error={error}
            rightElement={
              <button
                onClick={handleMax}
                className="text-xs text-accent-purple font-medium hover:text-accent-purple-hover transition-colors"
              >
                MAX
              </button>
            }
            className="text-2xl font-bold"
          />
        </div>

        <div className="text-center text-text-muted text-sm mb-6">
          ≈ $0.00 USD
        </div>
      </main>

      <div className="p-4">
        <Button fullWidth onClick={handleContinue} disabled={!amount}>
          Continue
        </Button>
      </div>
    </div>
  );
}
