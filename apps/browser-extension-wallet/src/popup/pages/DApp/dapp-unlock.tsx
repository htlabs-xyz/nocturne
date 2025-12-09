import { useEffect, useState } from 'react';
import { Button, Card, Input, Spinner } from '@/popup/components';
import { createMessage } from '@/shared/types/messages';

type Step = 'unlock' | 'approve';

export function DAppUnlock() {
  const [origin, setOrigin] = useState('');
  const [requestId, setRequestId] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [hostname, setHostname] = useState('Unknown');
  const [step, setStep] = useState<Step>('unlock');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const originParam = params.get('origin') || '';
    const requestIdParam = params.get('requestId') || '';
    const needsApprovalParam = params.get('needsApproval') === 'true';

    setOrigin(originParam);
    setRequestId(requestIdParam);
    setNeedsApproval(needsApprovalParam);

    try {
      setHostname(new URL(originParam).hostname);
    } catch {
      setHostname(originParam || 'Unknown');
    }
  }, []);

  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const message = createMessage('WALLET_UNLOCK', { password });
      const response = await chrome.runtime.sendMessage(message);

      if (!response.success) {
        setError(response.error || 'Invalid password');
        setIsLoading(false);
        return;
      }

      if (needsApproval) {
        setStep('approve');
        setIsLoading(false);
      } else {
        await handleApprove();
      }
    } catch (err) {
      setError('Failed to unlock wallet');
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const message = createMessage('APPROVE_CONNECTION', { requestId, origin });
      await chrome.runtime.sendMessage(message);
      window.close();
    } catch {
      setError('Failed to approve connection');
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const message = createMessage('REJECT_CONNECTION', { requestId });
      await chrome.runtime.sendMessage(message);
      window.close();
    } catch {
      window.close();
    }
  };

  if (!requestId) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  if (step === 'unlock') {
    return (
      <div className="flex flex-col h-full p-4">
        <h1 className="text-xl font-bold text-white text-center mb-4">Unlock Wallet</h1>

        <Card className="mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-midnight-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">
              🔐
            </div>
            <p className="text-white font-medium">{hostname}</p>
            <p className="text-gray-400 text-sm mt-1">wants to connect to your wallet</p>
          </div>
        </Card>

        <div className="mb-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <div className="mt-auto flex gap-3">
          <Button variant="secondary" onClick={handleReject} disabled={isLoading} fullWidth>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUnlock} loading={isLoading} fullWidth>
            Unlock
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <h1 className="text-xl font-bold text-white text-center mb-4">Connection Request</h1>

      <Card className="mb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-midnight-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">
            🌐
          </div>
          <p className="text-white font-medium">{hostname}</p>
          <p className="text-gray-400 text-sm mt-1">wants to connect to your wallet</p>
        </div>
      </Card>

      <div className="space-y-2 mb-6">
        <p className="text-gray-400 text-sm">This site will be able to:</p>
        <ul className="text-sm text-white space-y-2">
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            View your wallet address
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            Request transaction approval
          </li>
        </ul>
      </div>

      <div className="mt-auto flex gap-3">
        <Button variant="secondary" onClick={handleReject} disabled={isLoading} fullWidth>
          Reject
        </Button>
        <Button variant="primary" onClick={handleApprove} loading={isLoading} fullWidth>
          Connect
        </Button>
      </div>
    </div>
  );
}
