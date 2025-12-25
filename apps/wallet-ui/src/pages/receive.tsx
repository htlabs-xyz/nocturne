import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Coins, Shield, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clsx } from 'clsx';

type AddressType = 'night' | 'shield';

const addresses = {
  night: '0x1234567890abcdef1234567890abcdef12345678',
  shield: '0xfedcba0987654321fedcba0987654321fedcba09',
};

export function ReceivePage() {
  const [selectedType, setSelectedType] = useState<AddressType>('night');
  const [copied, setCopied] = useState(false);

  const address = addresses[selectedType];
  const isNight = selectedType === 'night';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Receive</h1>
      <p className="text-midnight-400">Select what you want to receive</p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSelectedType('night')}
          className={clsx(
            'p-4 rounded-xl border transition-colors text-left',
            selectedType === 'night'
              ? 'border-night bg-night/10'
              : 'border-midnight-700 bg-midnight-800 hover:border-midnight-600'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Coins size={18} className="text-night" />
            <span className="font-medium text-midnight-100">Receive NIGHT</span>
          </div>
          <Badge variant="warning" size="sm">Public</Badge>
        </button>

        <button
          onClick={() => setSelectedType('shield')}
          className={clsx(
            'p-4 rounded-xl border transition-colors text-left',
            selectedType === 'shield'
              ? 'border-shield bg-shield/10'
              : 'border-midnight-700 bg-midnight-800 hover:border-midnight-600'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-shield" />
            <span className="font-medium text-midnight-100">Receive DUST</span>
          </div>
          <Badge variant="shield" size="sm">Private</Badge>
        </button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center p-8">
          <div className="p-4 bg-white rounded-xl mb-6">
            <QRCodeSVG value={address} size={200} />
          </div>

          <div className="flex items-center gap-2 mb-4">
            {isNight ? <Coins size={20} className="text-night" /> : <Shield size={20} className="text-shield" />}
            <span className="font-heading font-semibold text-midnight-100">
              {isNight ? 'NIGHT Address' : 'Shield Address'}
            </span>
          </div>

          <p className="font-mono text-sm text-midnight-300 text-center break-all mb-6 max-w-[300px]">
            {address}
          </p>

          <Button onClick={handleCopy} className="gap-2 w-full max-w-[200px]">
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Address'}
          </Button>

          <p className="text-xs text-midnight-500 mt-4 text-center">
            Only receive {isNight ? 'NIGHT tokens' : 'DUST'} on Midnight Network
          </p>
        </CardContent>
      </Card>

      <Card className={clsx(
        'border',
        isNight ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-shield/30 bg-shield/5'
      )}>
        <CardContent className="p-4 flex items-start gap-3">
          {isNight ? <Coins size={20} className="text-yellow-500 shrink-0" /> : <Zap size={20} className="text-shield shrink-0" />}
          <div className="text-sm">
            {isNight ? (
              <p className="text-midnight-300">
                <span className="font-medium text-yellow-500">Public address.</span> Transactions to this address are visible on blockchain.
              </p>
            ) : (
              <p className="text-midnight-300">
                <span className="font-medium text-shield-light">Private address.</span> DUST received here remains shielded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
