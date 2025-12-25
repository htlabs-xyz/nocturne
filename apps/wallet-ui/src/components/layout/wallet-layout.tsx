import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function WalletLayout() {
  return (
    <div className="min-h-screen flex bg-midnight-900">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header walletName="Midnight Wallet" network="testnet" />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
