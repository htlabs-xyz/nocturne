import { Card, TokenIcon } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { mockTokens } from '../../stores/mock-data';

export function SelectToken() {
  const { setRoute, setSelectedToken, goBack } = useUIStore();

  const handleSelect = (symbol: string) => {
    setSelectedToken(symbol);
    setRoute('send-amount');
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
        <h1 className="text-lg font-semibold text-white">Select Token</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <Card className="p-2">
          {mockTokens.map((token) => (
            <button
              key={token.symbol}
              onClick={() => handleSelect(token.symbol)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-midnight-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <TokenIcon symbol={token.symbol} icon={token.icon} />
                <div className="text-left">
                  <p className="text-white font-medium">{token.symbol}</p>
                  <p className="text-text-muted text-xs">{token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white">{token.balance}</p>
                <p className="text-text-muted text-xs">{token.usd}</p>
              </div>
            </button>
          ))}
        </Card>
      </main>
    </div>
  );
}
