import { Header, BottomNav } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { useWalletStore } from '../../stores/wallet-store';
import { BalanceCard } from './balance-card';
import { TokenList } from './token-list';
import { ActionButton } from './action-button';
import type { Token } from '../../stores/mock-data';

function formatBalance(value: string): string {
  const num = BigInt(value || '0');
  const divisor = BigInt(1_000_000);
  const intPart = num / divisor;
  const decPart = num % divisor;
  if (decPart === 0n) return intPart.toString();
  const decStr = decPart.toString().padStart(6, '0').replace(/0+$/, '');
  return `${intPart}.${decStr}`;
}

export function Dashboard() {
  const { setRoute, activeTab, setActiveTab, setSelectedToken } = useUIStore();
  const { balance } = useWalletStore();

  const tokens: Token[] = [
    {
      symbol: 'NIGHT',
      name: 'Night Token',
      balance: formatBalance(balance?.unshielded || '0'),
      usd: '$0.00',
      icon: '🌙',
    },
    {
      symbol: 'tDUST',
      name: 'Dust',
      balance: formatBalance(balance?.dust || '0'),
      usd: '$0.00',
      icon: '✨',
    },
  ];

  const handleTokenClick = (token: { symbol: string }) => {
    setSelectedToken(token.symbol);
    setRoute('send');
  };

  return (
    <div className="flex flex-col h-full bg-midnight-900">
      <Header
        onSettingsClick={() => setActiveTab('settings')}
        onAccountClick={() => {}}
      />

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <BalanceCard
          totalUsd="$0.00"
          shielded={{ hidden: false, amount: formatBalance(balance?.shielded || '0') }}
          unshielded={{
            token: 'NIGHT',
            amount: formatBalance(balance?.unshielded || '0'),
          }}
          dust={{ amount: formatBalance(balance?.dust || '0') }}
        />

        <div className="flex gap-2">
          <ActionButton
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            }
            label="Send"
            onClick={() => setRoute('send')}
          />
          <ActionButton
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            }
            label="Receive"
            onClick={() => setRoute('receive')}
          />
          <ActionButton
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
            label="Swap"
            onClick={() => {}}
          />
        </div>

        <TokenList tokens={tokens} onTokenClick={handleTokenClick} />
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
