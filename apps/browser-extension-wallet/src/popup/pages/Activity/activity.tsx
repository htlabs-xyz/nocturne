import { Header, BottomNav, Card, TokenIcon } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { mockActivity } from '../../stores/mock-data';

function TransactionItem({ tx }: { tx: typeof mockActivity[0] }) {
  const isSend = tx.type === 'send';

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isSend ? 'bg-accent-red/20' : 'bg-accent-green/20'
        }`}>
          {isSend ? (
            <svg className="w-4 h-4 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-white font-medium text-sm">
            {isSend ? 'Sent' : 'Received'} {tx.token}
          </p>
          <p className="text-text-muted text-xs">{tx.time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium text-sm ${isSend ? 'text-accent-red' : 'text-accent-green'}`}>
          {isSend ? '-' : '+'}{tx.amount} {tx.token}
        </p>
        <p className="text-text-muted text-xs">{tx.status}</p>
      </div>
    </div>
  );
}

export function Activity() {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <div className="flex flex-col h-full bg-midnight-900">
      <Header />

      <main className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>

        {mockActivity.length > 0 ? (
          <Card className="p-2">
            <div className="divide-y divide-midnight-500">
              {mockActivity.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-midnight-700 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm">No transactions yet</p>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
