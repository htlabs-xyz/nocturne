import { Button } from '../../components';
import { useUIStore } from '../../stores/ui-store';

export function CreateWallet() {
  const setRoute = useUIStore((s) => s.setRoute);

  return (
    <div className="flex flex-col h-full bg-midnight-900 p-6">
      <button
        onClick={() => setRoute('welcome')}
        className="self-start p-2 -ml-2 text-text-secondary hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 flex flex-col">
        <h1 className="text-xl font-bold text-white mb-2">Create New Wallet</h1>
        <p className="text-text-secondary text-sm mb-6">
          We&apos;ll generate a secure seed phrase for your new wallet
        </p>

        <div className="bg-midnight-700 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Secure Your Wallet</p>
              <p className="text-text-muted text-xs mt-1">
                Your seed phrase is the only way to recover your wallet. Never share it with anyone.
              </p>
            </div>
          </div>
        </div>

        <ul className="space-y-3 mb-8">
          {[
            'Write down your seed phrase on paper',
            'Store it in a secure location',
            'Never share it with anyone',
            'Never enter it on any website',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
              <svg className="w-4 h-4 text-accent-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Button fullWidth onClick={() => setRoute('seed-phrase')}>
        Generate Seed Phrase
      </Button>
    </div>
  );
}
