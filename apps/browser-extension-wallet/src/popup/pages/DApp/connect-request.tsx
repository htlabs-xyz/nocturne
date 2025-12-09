import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from '@/popup/components';
import { createMessage } from '@/shared/types/messages';

export function ConnectRequest() {
  const [origin, setOrigin] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hostname, setHostname] = useState<string>('Unknown');

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const originParam = params.get('origin') || '';
    const requestIdParam = params.get('requestId') || '';

    setOrigin(originParam);
    setRequestId(requestIdParam);

    try {
      setHostname(new URL(originParam).hostname);
    } catch {
      setHostname(originParam || 'Unknown');
    }
  }, []);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const message = createMessage('APPROVE_CONNECTION', { requestId, origin });
      await chrome.runtime.sendMessage(message);
      window.close();
    } catch (error) {
      console.error('Failed to approve connection:', error);
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const message = createMessage('REJECT_CONNECTION', { requestId });
      await chrome.runtime.sendMessage(message);
      window.close();
    } catch (error) {
      console.error('Failed to reject connection:', error);
      setIsLoading(false);
    }
  };

  if (!requestId) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Spinner size="lg" />
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
        <Button
          variant="secondary"
          onClick={handleReject}
          disabled={isLoading}
          fullWidth
        >
          Reject
        </Button>
        <Button
          variant="primary"
          onClick={handleApprove}
          loading={isLoading}
          fullWidth
        >
          Connect
        </Button>
      </div>
    </div>
  );
}
