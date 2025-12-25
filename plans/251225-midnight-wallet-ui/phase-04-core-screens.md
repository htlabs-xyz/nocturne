# Phase 04: Core Screens

## Objective

Implement Dashboard, Send, and Receive screens - the most frequently used wallet flows.

## Screen 1: Dashboard

### Layout Structure

```
+-----------------------------------------------+
|  Balance Card (NIGHT)                         |
|  +-------------------------------------------+|
|  | 2.5 NIGHT                                 ||
|  | $5,000.00 USD  +2.3% (24h)               ||
|  +-------------------------------------------+|
|                                               |
|  DUST Capacity                                |
|  +-------------------------------------------+|
|  | [======     ] 800 / 1,000 DUST           ||
|  | Generating: +50/day  Status: Active      ||
|  +-------------------------------------------+|
|                                               |
|  Quick Actions                                |
|  [Send NIGHT] [Send DUST] [Receive]           |
|                                               |
|  My Addresses                                 |
|  +-------------------------------------------+|
|  | NIGHT: 0x1234...5678 [copy]              ||
|  | Shield: [hidden] [show]                  ||
|  +-------------------------------------------+|
|                                               |
|  Recent Activity                              |
|  +-------------------------------------------+|
|  | ↓ Received NIGHT +1.0    Dec 24          ||
|  | ↑ Sent DUST -50          Dec 23          ||
|  | ⚡ DUST Generated +50     Dec 22          ||
|  +-------------------------------------------+|
+-----------------------------------------------+
```

### Implementation

```tsx
// src/pages/dashboard.tsx
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Zap, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddressDisplay, DustCapacityBar, TokenBadge, PrivacyIndicator } from '@/components/wallet';
import { useNavigate } from 'react-router-dom';

// Mock data - replace with store data in Phase 06
const mockData = {
  nightBalance: 2.5,
  nightUsd: 5000,
  priceChange: 2.3,
  dustCurrent: 800,
  dustMax: 1000,
  dustRate: 50,
  dustStatus: 'active' as const,
  addresses: {
    night: '0x1234567890abcdef1234567890abcdef12345678',
    shield: '0xfedcba0987654321fedcba0987654321fedcba09',
  },
  recentTx: [
    { id: '1', type: 'receive', token: 'night', amount: 1.0, date: 'Dec 24', isPrivate: false },
    { id: '2', type: 'send', token: 'dust', amount: 50, date: 'Dec 23', isPrivate: true },
    { id: '3', type: 'generation', token: 'dust', amount: 50, date: 'Dec 22', isPrivate: false },
  ],
};

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* NIGHT Balance Card */}
      <Card className="bg-gradient-to-br from-midnight-800 to-midnight-900 border-night/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TokenBadge type="night" size="sm" />
                <span className="text-midnight-400 text-sm">NIGHT Balance</span>
              </div>
              <p className="font-heading text-4xl font-bold text-midnight-50">
                {mockData.nightBalance.toLocaleString()} NIGHT
              </p>
              <p className="text-midnight-300 mt-1">
                ≈ ${mockData.nightUsd.toLocaleString()} USD
              </p>
            </div>
            <div className={`flex items-center gap-1 text-sm ${mockData.priceChange >= 0 ? 'text-dust' : 'text-red-400'}`}>
              {mockData.priceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{mockData.priceChange >= 0 ? '+' : ''}{mockData.priceChange}%</span>
              <span className="text-midnight-500">(24h)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DUST Capacity */}
      <DustCapacityBar
        current={mockData.dustCurrent}
        max={mockData.dustMax}
        generationRate={mockData.dustRate}
        status={mockData.dustStatus}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={() => navigate('/send?token=night')} className="flex-1 gap-2">
            <Send size={18} />
            Send NIGHT
          </Button>
          <Button
            onClick={() => navigate('/send?token=dust')}
            variant="secondary"
            className="flex-1 gap-2 bg-dust/20 text-dust-light border border-dust/30 hover:bg-dust/30"
          >
            <Zap size={18} />
            Send DUST
          </Button>
          <Button onClick={() => navigate('/receive')} variant="secondary" className="flex-1 gap-2">
            <ArrowDownLeft size={18} />
            Receive
          </Button>
        </CardContent>
      </Card>

      {/* My Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>My Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AddressDisplay
            address={mockData.addresses.night}
            type="night"
            label="NIGHT Address (Unshielded)"
            showCopy
            showExplorer
          />
          <div className="border-t border-midnight-700" />
          <AddressDisplay
            address={mockData.addresses.shield}
            type="shield"
            label="Shield Address (Private)"
            showCopy
          />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            View All
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockData.recentTx.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  tx.type === 'receive' ? 'bg-dust/20 text-dust' :
                  tx.type === 'send' ? 'bg-night/20 text-night' :
                  'bg-shield/20 text-shield'
                }`}>
                  {tx.type === 'receive' ? <ArrowDownLeft size={16} /> :
                   tx.type === 'send' ? <ArrowUpRight size={16} /> :
                   <Zap size={16} />}
                </div>
                <div>
                  <p className="text-midnight-100 font-medium">
                    {tx.type === 'receive' ? 'Received' :
                     tx.type === 'send' ? 'Sent' :
                     'Generated'} {tx.token.toUpperCase()}
                  </p>
                  <p className="text-midnight-400 text-sm">{tx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-medium ${
                  tx.type === 'send' ? 'text-red-400' : 'text-dust'
                }`}>
                  {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token.toUpperCase()}
                </span>
                {tx.isPrivate && <PrivacyIndicator isPrivate size="sm" showLabel={false} />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Screen 2: Send Flow

### Layout Structure (Multi-step)

**Step 1: Choose Token Type**
```
+-----------------------------------------------+
|  What do you want to send?                    |
|                                               |
|  +-------------------------------------------+|
|  | Send NIGHT (Public)                       ||
|  | - Visible on blockchain                   ||
|  | - Balance: 2.5 NIGHT                      ||
|  +-------------------------------------------+|
|                                               |
|  +-------------------------------------------+|
|  | Send DUST (Private)                       ||
|  | - Metadata hidden                         ||
|  | - Balance: 800 DUST                       ||
|  +-------------------------------------------+|
+-----------------------------------------------+
```

**Step 2: Enter Details**
```
+-----------------------------------------------+
|  Send NIGHT                                   |
|                                               |
|  Recipient Address                            |
|  [________________________________] [QR]      |
|                                               |
|  Amount                                       |
|  [____] NIGHT  ≈ $____                       |
|  Available: 2.5 NIGHT [Max]                   |
|                                               |
|  Network Fee (in DUST)                        |
|  [Slow] [Standard] [Fast]                     |
|  50 DUST (~$10)                               |
|                                               |
|  [Review Transaction]                         |
+-----------------------------------------------+
```

**Step 3: Confirmation**
```
+-----------------------------------------------+
|  Confirm Transaction                          |
|                                               |
|  From: 0x1234...5678                          |
|  To: 0xabcd...ef01                            |
|  Amount: 1.0 NIGHT                            |
|  Fee: 50 DUST                                 |
|                                               |
|  ⚠️ This is a PUBLIC transaction              |
|                                               |
|  [Confirm & Send]  [Cancel]                   |
+-----------------------------------------------+
```

### Implementation

```tsx
// src/pages/send.tsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Zap, QrCode, AlertTriangle, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

  // Mock balances
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
    // TODO: Connect to SDK in Phase 06
    setStep('success');
  };

  // Step: Select Token
  if (step === 'select') {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-midnight-50">Send</h1>
        <p className="text-midnight-400">What do you want to send?</p>

        <div className="space-y-4">
          {/* NIGHT Option */}
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

          {/* DUST Option */}
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

  // Step: Enter Details
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
            {/* Recipient */}
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

            {/* Amount */}
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

            {/* Fee Selection (for NIGHT only) */}
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

            {/* Privacy Note */}
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

  // Step: Confirm
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

  // Step: Success
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
```

## Screen 3: Receive Flow

### Implementation

```tsx
// src/pages/receive.tsx
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Add to dependencies
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

      {/* Address Type Selector */}
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

      {/* QR Code Card */}
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

      {/* Privacy Note */}
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
```

## Additional Dependency

Add QR code library to package.json:

```bash
bun add qrcode.react
```

## Verification

```bash
bun run dev
# Test flows:
# 1. Dashboard shows balance cards, DUST bar, addresses, recent tx
# 2. Send flow: select token -> enter details -> confirm -> success
# 3. Receive flow: toggle NIGHT/DUST, copy address, QR renders
```

## Output

- Fully functional Dashboard with balance display
- Multi-step Send flow (NIGHT + DUST)
- Receive flow with QR code generation
- Privacy indicators throughout
