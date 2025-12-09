import { useEffect } from 'react';
import { useUIStore } from './stores/ui-store';
import { useWalletStore } from './stores/wallet-store';
import { Welcome, CreateWallet, ImportWallet, SeedPhrase, SetPassword, Unlock } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { SelectToken, EnterAmount, EnterAddress, ConfirmSend } from './pages/Send';
import { Receive } from './pages/Receive';
import { Activity } from './pages/Activity';
import { Settings, ConnectedSites, Security } from './pages/Settings';
import { Spinner } from './components';

export function App() {
  const route = useUIStore((s) => s.route);
  const setRoute = useUIStore((s) => s.setRoute);
  const { initialize, hasWallet, isUnlocked, isLoading } = useWalletStore();

  useEffect(() => {
    initialize().then(() => {
      const state = useWalletStore.getState();
      if (state.hasWallet) {
        if (state.isUnlocked) {
          setRoute('dashboard');
        } else {
          setRoute('unlock');
        }
      } else {
        setRoute('welcome');
      }
    });
  }, []);

  if (isLoading && route === 'welcome') {
    return (
      <div className="w-[360px] h-[600px] bg-midnight-900 text-white flex items-center justify-center">
        <Spinner size="lg" />
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
