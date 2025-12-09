import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from '@/popup/components';
import { createMessage } from '@/shared/types/messages';

interface PendingRequest {
  requestId: string;
  origin: string;
  method: string;
  params?: unknown;
}

const TYPE_LABELS: Record<string, string> = {
  balance: 'Balance Transaction',
  prove: 'Prove Transaction',
  balanceAndProve: 'Balance & Prove Transaction',
  submit: 'Submit Transaction',
};

export function TransactionApproval() {
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hostname, setHostname] = useState<string>('Unknown');
  const [type, setType] = useState<string>('');

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const requestIdParam = params.get('requestId') || '';
    const originParam = params.get('origin') || '';
    const typeParam = params.get('type') || '';

    setType(typeParam);

    try {
      setHostname(new URL(originParam).hostname);
    } catch {
      setHostname(originParam || 'Unknown');
    }

    if (requestIdParam) {
      loadPendingRequest(requestIdParam);
    }
  }, []);

  const loadPendingRequest = async (requestId: string) => {
    try {
      const message = createMessage('GET_PENDING_REQUEST', { requestId });
      const response = await chrome.runtime.sendMessage(message);
      if (response.success && response.data) {
        setRequest(response.data);
      } else {
        setError('Request not found');
      }
    } catch (err) {
      setError('Failed to load request');
      console.error('Failed to load pending request:', err);
    }
  };

  const handleApprove = async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      const message = createMessage('APPROVE_TRANSACTION', { requestId: request.requestId });
      await chrome.runtime.sendMessage(message);
      window.close();
    } catch (err) {
      console.error('Failed to approve transaction:', err);
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      const message = createMessage('REJECT_TRANSACTION', { requestId: request.requestId });
      await chrome.runtime.sendMessage(message);
      window.close();
    } catch (err) {
      console.error('Failed to reject transaction:', err);
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <p className="text-red-400 text-center">{error}</p>
        <Button variant="secondary" onClick={() => window.close()} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <h1 className="text-xl font-bold text-white text-center mb-4">Transaction Request</h1>

      <Card className="mb-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-midnight-500 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl">
            📝
          </div>
          <p className="text-white font-medium">{hostname}</p>
          <p className="text-accent-purple text-sm mt-1">{TYPE_LABELS[type] || type}</p>
        </div>
      </Card>

      <Card className="mb-4 flex-1 overflow-auto">
        <p className="text-gray-400 text-sm mb-2">Transaction Details</p>
        <pre className="text-xs text-white bg-midnight-700 rounded-lg p-3 overflow-auto max-h-48">
          {JSON.stringify(request.params, null, 2)}
        </pre>
      </Card>

      <div className="space-y-2 mb-4">
        <p className="text-gray-400 text-sm">This action will:</p>
        <ul className="text-sm text-white space-y-1">
          {type === 'balance' && (
            <li className="flex items-center gap-2">
              <span className="text-yellow-400">⚠️</span>
              Balance the transaction
            </li>
          )}
          {type === 'prove' && (
            <li className="flex items-center gap-2">
              <span className="text-yellow-400">⚠️</span>
              Generate proof for transaction
            </li>
          )}
          {type === 'balanceAndProve' && (
            <>
              <li className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                Balance the transaction
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                Generate proof for transaction
              </li>
            </>
          )}
          {type === 'submit' && (
            <li className="flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              Submit transaction to network
            </li>
          )}
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
          Approve
        </Button>
      </div>
    </div>
  );
}
