import { useState } from 'react';
import { Button, Card, TokenIcon, AddressDisplay } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { mockTokens, mockWallet } from '../../stores/mock-data';

export function ConfirmSend() {
  const { selectedToken, sendAmount, sendAddress, setRoute, resetSendFlow, goBack } = useUIStore();
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = mockTokens.find((t) => t.symbol === selectedToken);
  const networkFee = '0.001';

  const handleConfirm = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSending(false);
    setSuccess(true);
  };

  const handleDone = () => {
    resetSendFlow();
    setRoute('dashboard');
  };

  if (success) {
    return (
      <div className="flex flex-col h-full bg-midnight-900 p-6">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Transaction Sent!</h2>
          <p className="text-text-secondary text-center text-sm">
            Your transaction has been broadcast to the network
          </p>
        </div>
        <Button fullWidth onClick={handleDone}>
          Done
        </Button>
      </div>
    );
  }

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
        <h1 className="text-lg font-semibold text-white">Confirm Transaction</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <div className="flex items-center justify-center gap-3 mb-4">
            {token && <TokenIcon symbol={token.symbol} icon={token.icon} size="lg" />}
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{sendAmount} {selectedToken}</p>
              <p className="text-text-muted text-sm">≈ $0.00 USD</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">From</span>
              <AddressDisplay address={mockWallet.address} className="text-text-secondary" />
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">To</span>
              <AddressDisplay address={sendAddress} className="text-text-secondary" />
            </div>
            <div className="border-t border-midnight-500 pt-3">
              <div className="flex justify-between">
                <span className="text-text-muted text-sm">Network Fee</span>
                <span className="text-text-secondary text-sm">{networkFee} {selectedToken}</span>
              </div>
            </div>
          </div>
        </Card>
      </main>

      <div className="p-4 space-y-3">
        <Button fullWidth onClick={handleConfirm} loading={sending}>
          Confirm & Send
        </Button>
        <Button fullWidth variant="ghost" onClick={goBack} disabled={sending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
