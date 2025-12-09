import { useState } from 'react';
import { Button, Card, Modal, Input, Spinner } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { useWalletStore } from '../../stores/wallet-store';

export function Security() {
  const { goBack } = useUIStore();
  const { getSeedPhrase } = useWalletStore();
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const seed = await getSeedPhrase(password);
      setSeedPhrase(seed.split(' '));
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSeedModal(false);
    setSeedPhrase([]);
    setPassword('');
    setError(null);
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
        <h1 className="text-lg font-semibold text-white">Security</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card className="p-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-midnight-500 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-midnight-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Change Password</p>
              <p className="text-text-muted text-xs">Update your wallet password</p>
            </div>
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setShowSeedModal(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-midnight-500 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-midnight-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">View Seed Phrase</p>
              <p className="text-text-muted text-xs">Reveal your recovery phrase</p>
            </div>
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </Card>

        <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-accent-red text-xs">
              Never share your seed phrase or password with anyone. Support will never ask for these.
            </p>
          </div>
        </div>
      </main>

      <Modal
        isOpen={showSeedModal}
        onClose={handleCloseModal}
        title="View Seed Phrase"
      >
        {seedPhrase.length === 0 ? (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              Enter your password to reveal your seed phrase
            </p>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              error={error || undefined}
              disabled={isLoading}
            />
            <Button fullWidth onClick={handleVerify} disabled={isLoading || !password.trim()}>
              {isLoading ? <Spinner size="sm" /> : 'Verify'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-1.5">
              {seedPhrase.map((word, i) => (
                <div key={i} className="bg-midnight-700 rounded-lg px-1.5 py-1 text-center">
                  <span className="text-text-muted text-[10px] mr-0.5">{i + 1}.</span>
                  <span className="text-white text-[10px]">{word}</span>
                </div>
              ))}
            </div>
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
              <p className="text-accent-red text-xs text-center">
                Keep this phrase secret and safe
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <Input
            type="password"
            label="Current Password"
            placeholder="Enter current password"
          />
          <Input
            type="password"
            label="New Password"
            placeholder="Enter new password"
          />
          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Confirm new password"
          />
          <Button fullWidth onClick={() => setShowPasswordModal(false)}>
            Update Password
          </Button>
        </div>
      </Modal>
    </div>
  );
}
