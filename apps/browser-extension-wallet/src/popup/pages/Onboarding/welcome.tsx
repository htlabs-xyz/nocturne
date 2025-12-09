import { Button } from '../../components';
import { useUIStore } from '../../stores/ui-store';

export function Welcome() {
  const setRoute = useUIStore((s) => s.setRoute);

  return (
    <div className="flex flex-col h-full bg-midnight-900 p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple to-indigo-600 flex items-center justify-center mb-6">
          <span className="text-4xl font-bold text-white">N</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Welcome to Nocturne</h1>
        <p className="text-text-secondary text-center mb-8">
          Your secure wallet for the Midnight Network
        </p>

        <div className="w-full space-y-3">
          <Button fullWidth onClick={() => setRoute('create-wallet')}>
            Create New Wallet
          </Button>
          <Button fullWidth variant="secondary" onClick={() => setRoute('import-wallet')}>
            Import Existing Wallet
          </Button>
        </div>
      </div>

      <p className="text-xs text-text-muted text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
