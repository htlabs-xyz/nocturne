import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Zap, QrCode, AlertTriangle, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TokenBadge, PrivacyIndicator } from '@/components/wallet';
import { clsx } from 'clsx';

type SendStep = 'select' | 'details' | 'confirm' | 'success';
type TokenType = 'night' | 'dust';
type FeeSpeed = 'slow' | 'standard' | 'fast';

const feeOptions: Record<FeeSpeed, { label: string; dust: number }> = {
  slow: { label: 'Slow (~5 min)', dust: 30 },
  standard: { label: 'Standard (~1 min)', dust: 50 },
  fast: { label: 'Fast (~15 sec)', dust: 100 },
};

export function SendPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = searchParams.get('token') as TokenType | null;

  const [step, setStep] = useState<SendStep>(initialToken ? 'details' : 'select');
  const [tokenType, setTokenType] = useState<TokenType>(initialToken || 'night');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [feeSpeed, setFeeSpeed] = useState<FeeSpeed>('standard');

  const balances = { night: 2.5, dust: 800 };

  const handleTokenSelect = (type: TokenType) => {
    setTokenType(type);
    setStep('details');
  };

  const handleReview = () => {
    if (!recipient || !amount) return;
    setStep('confirm');
  };

  const handleSend = () => {
    setStep('success');
  };

  if (step === 'select') {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-midnight-50">Send</h1>
        <p className="text-midnight-400">What do you want to send?</p>

        <div className="space-y-4">
          <button
            onClick={() => handleTokenSelect('night')}
            className="w-full p-5 rounded-xl bg-midnight-800 border border-midnight-700 hover:border-night/50 transition-colors text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-night/20">
                <Coins size={24} className="text-night" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading font-semibold text-midnight-50">Send NIGHT</span>
                  <Badge variant="warning">Public</Badge>
                </div>
                <p className="text-sm text-midnight-400 mb-2">
                  Visible on blockchain. Transaction details public.
                </p>
                <p className="text-sm text-midnight-300">
                  Balance: <span className="font-semibold">{balances.night} NIGHT</span>
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleTokenSelect('dust')}
            className="w-full p-5 rounded-xl bg-midnight-800 border border-midnight-700 hover:border-dust/50 transition-colors text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-dust/20">
                <Zap size={24} className="text-dust" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading font-semibold text-midnight-50">Send DUST</span>
                  <Badge variant="shield">Private</Badge>
                </div>
                <p className="text-sm text-midnight-400 mb-2">
                  Shielded transaction. Metadata hidden from chain.
                </p>
                <p className="text-sm text-midnight-300">
                  Balance: <span className="font-semibold">{balances.dust} DUST</span>
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    const isNight = tokenType === 'night';
    const maxAmount = isNight ? balances.night : balances.dust;

    return (
      <div className="space-y-6">
        <button onClick={() => setStep('select')} className="flex items-center gap-2 text-midnight-400 hover:text-midnight-200">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <TokenBadge type={tokenType} size="lg" />
          <h1 className="font-heading text-2xl font-bold text-midnight-50">
            Send {isNight ? 'NIGHT' : 'DUST'}
          </h1>
        </div>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-midnight-300">Recipient Address</label>
                <button className="p-1.5 text-midnight-400 hover:text-midnight-200">
                  <QrCode size={18} />
                </button>
              </div>
              <Input
                placeholder={isNight ? 'Enter unshielded address' : 'Enter shield address'}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-midnight-300">Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-24"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-midnight-400">{isNight ? 'NIGHT' : 'DUST'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-midnight-400">Available: {maxAmount}</span>
                <button
                  onClick={() => setAmount(maxAmount.toString())}
                  className="text-night hover:text-night-light"
                >
                  Max
                </button>
              </div>
            </div>

            {isNight && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-midnight-300">Network Fee (in DUST)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(feeOptions) as [FeeSpeed, typeof feeOptions.slow][]).map(([key, opt]) => (
                    <button
                      key={key}
                      onClick={() => setFeeSpeed(key)}
                      className={clsx(
                        'p-3 rounded-lg text-center border transition-colors',
                        feeSpeed === key
                          ? 'border-night bg-night/10 text-night'
                          : 'border-midnight-700 bg-midnight-800 text-midnight-300 hover:border-midnight-600'
                      )}
                    >
                      <p className="font-medium text-sm">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                      <p className="text-xs mt-1">{opt.dust} DUST</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={clsx(
              'p-4 rounded-lg flex items-start gap-3',
              isNight ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-shield/10 border border-shield/20'
            )}>
              {isNight ? <AlertTriangle size={20} className="text-yellow-500 shrink-0" /> : <Check size={20} className="text-shield shrink-0" />}
              <div className="text-sm">
                {isNight ? (
                  <>
                    <p className="font-medium text-yellow-500">Public Transaction</p>
                    <p className="text-midnight-400 mt-1">
                      Your address, recipient, and amount will be visible on the blockchain.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-shield-light">Private Transaction</p>
                    <p className="text-midnight-400 mt-1">
                      Transaction metadata will be shielded. No fees required.
                    </p>
                  </>
                )}
              </div>
            </div>

            <Button onClick={handleReview} className="w-full" disabled={!recipient || !amount}>
              Review Transaction
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'confirm') {
    const isNight = tokenType === 'night';
    const fee = isNight ? feeOptions[feeSpeed].dust : 0;

    return (
      <div className="space-y-6">
        <button onClick={() => setStep('details')} className="flex items-center gap-2 text-midnight-400 hover:text-midnight-200">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="font-heading text-2xl font-bold text-midnight-50">Confirm Transaction</h1>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between py-2">
              <span className="text-midnight-400">Type</span>
              <PrivacyIndicator isPrivate={!isNight} />
            </div>
            <div className="border-t border-midnight-700" />
            <div className="flex items-center justify-between py-2">
              <span className="text-midnight-400">To</span>
              <span className="font-mono text-midnight-200 text-sm">{recipient.slice(0, 10)}...{recipient.slice(-8)}</span>
            </div>
            <div className="border-t border-midnight-700" />
            <div className="flex items-center justify-between py-2">
              <span className="text-midnight-400">Amount</span>
              <span className="font-semibold text-midnight-100">{amount} {isNight ? 'NIGHT' : 'DUST'}</span>
            </div>
            {isNight && (
              <>
                <div className="border-t border-midnight-700" />
                <div className="flex items-center justify-between py-2">
                  <span className="text-midnight-400">Fee</span>
                  <span className="text-midnight-300">{fee} DUST</span>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setStep('details')} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSend} className="flex-1">
                Confirm & Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-dust/20 flex items-center justify-center mb-6">
        <Check size={32} className="text-dust" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-midnight-50 mb-2">Transaction Submitted</h1>
      <p className="text-midnight-400 mb-8">Your transaction is being processed.</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/history')}>
          View History
        </Button>
        <Button onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
