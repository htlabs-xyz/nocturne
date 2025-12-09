import { useState } from 'react';
import { Button, Card, AddressDisplay } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { mockWallet } from '../../stores/mock-data';

export function Receive() {
  const { goBack } = useUIStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mockWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h1 className="text-lg font-semibold text-white">Receive</h1>
      </header>

      <main className="flex-1 p-4 flex flex-col items-center">
        <p className="text-text-secondary text-sm text-center mb-6">
          Share your address to receive tokens
        </p>

        <Card className="w-full mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-48 h-48 bg-white rounded-xl p-3 flex items-center justify-center">
              <div className="w-full h-full bg-midnight-900 rounded-lg flex items-center justify-center">
                <svg className="w-32 h-32 text-white" viewBox="0 0 100 100">
                  <rect x="10" y="10" width="20" height="20" fill="currentColor" />
                  <rect x="70" y="10" width="20" height="20" fill="currentColor" />
                  <rect x="10" y="70" width="20" height="20" fill="currentColor" />
                  <rect x="40" y="10" width="10" height="10" fill="currentColor" />
                  <rect x="40" y="30" width="10" height="10" fill="currentColor" />
                  <rect x="40" y="50" width="10" height="10" fill="currentColor" />
                  <rect x="50" y="40" width="10" height="10" fill="currentColor" />
                  <rect x="60" y="50" width="10" height="10" fill="currentColor" />
                  <rect x="70" y="40" width="10" height="10" fill="currentColor" />
                  <rect x="80" y="50" width="10" height="10" fill="currentColor" />
                  <rect x="10" y="40" width="10" height="10" fill="currentColor" />
                  <rect x="20" y="50" width="10" height="10" fill="currentColor" />
                  <rect x="30" y="60" width="10" height="10" fill="currentColor" />
                  <rect x="50" y="70" width="10" height="10" fill="currentColor" />
                  <rect x="70" y="70" width="20" height="10" fill="currentColor" />
                  <rect x="80" y="80" width="10" height="10" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-midnight-700 rounded-xl p-3">
            <p className="text-text-muted text-xs mb-1">Your Address</p>
            <p className="text-white text-sm font-mono break-all">{mockWallet.address}</p>
          </div>
        </Card>

        <Button fullWidth onClick={handleCopy}>
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Address
            </>
          )}
        </Button>
      </main>
    </div>
  );
}
