import { useEffect, useState, useRef } from 'react';
import { useUIStore } from './stores/ui-store';
import { useWalletStore } from './stores/wallet-store';
import { Welcome, CreateWallet, ImportWallet, SeedPhrase, SetPassword, Unlock } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { SelectToken, EnterAmount, EnterAddress, ConfirmSend } from './pages/Send';
import { Receive } from './pages/Receive';
import { Activity } from './pages/Activity';
import { Settings, ConnectedSites, Security } from './pages/Settings';
import { ConnectRequest, DAppUnlock, TransactionApproval } from './pages/DApp';
import { Spinner } from './components';

export function App() {
  const route = useUIStore((s) => s.route);
  const setRoute = useUIStore((s) => s.setRoute);
  const { initialize, isLoading, error } = useWalletStore();
  const [initComplete, setInitComplete] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const hash = window.location.hash;
    if (hash.includes('/dapp-unlock')) {
      setRoute('dapp-unlock');
      setInitComplete(true);
      return;
    }
    if (hash.includes('/connect')) {
      setRoute('connect');
      setInitComplete(true);
      return;
    }
    if (hash.includes('/approve')) {
      setRoute('approve');
      setInitComplete(true);
      return;
    }

    initialize()
      .then(() => {
        const state = useWalletStore.getState();
        if (state.hasWallet) {
          setRoute(state.isUnlocked ? 'dashboard' : 'unlock');
        } else {
          setRoute('welcome');
        }
      })
      .catch((err) => {
        console.error('Init error:', err);
        setRoute('welcome');
      })
      .finally(() => {
        setInitComplete(true);
      });
  }, [initialize, setRoute]);

  if (!initComplete || (isLoading && route === 'welcome')) {
    return (
      <div className="w-[360px] h-[600px] bg-midnight-900 text-white flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        {error && <p className="text-red-400 text-sm px-4 text-center">{error}</p>}
      </div>
    );
  }

  const renderRoute = () => {
    switch (route) {
      case 'welcome':
        return <Welcome />;
      case 'create-wallet':
        return <CreateWallet />;
      case 'import-wallet':
        return <ImportWallet />;
      case 'seed-phrase':
        return <SeedPhrase />;
      case 'set-password':
        return <SetPassword />;
      case 'unlock':
        return <Unlock />;
      case 'dashboard':
        return <Dashboard />;
      case 'send':
        return <SelectToken />;
      case 'send-amount':
        return <EnterAmount />;
      case 'send-address':
        return <EnterAddress />;
      case 'send-confirm':
        return <ConfirmSend />;
      case 'receive':
        return <Receive />;
      case 'activity':
        return <Activity />;
      case 'settings':
        return <Settings />;
      case 'connected-sites':
        return <ConnectedSites />;
      case 'security':
        return <Security />;
      case 'connect':
        return <ConnectRequest />;
      case 'approve':
        return <TransactionApproval />;
      case 'dapp-unlock':
        return <DAppUnlock />;
      default:
        return <Welcome />;
    }
  };

  return (
    <div className="w-[360px] h-[600px] bg-midnight-900 text-white overflow-hidden">
      {renderRoute()}
    </div>
  );
}
