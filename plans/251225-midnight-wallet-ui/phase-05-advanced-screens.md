# Phase 05: Advanced Screens

## Objective

Implement History, Addresses, DUST Management, and Settings screens.

## Screen 1: Transaction History

### Layout Structure

```
+-----------------------------------------------+
|  Transaction History                          |
|                                               |
|  [All] [NIGHT] [DUST] [Generated]    [Search] |
|                                               |
|  Today                                        |
|  +-------------------------------------------+|
|  | ↓ Received NIGHT  +1.0 NIGHT     2:30 PM ||
|  |   From: 0x1234...  [Public] ✓            ||
|  +-------------------------------------------+|
|  | ↑ Sent DUST       -50 DUST       11:15 AM||
|  |   To: Hidden      [Private] ✓            ||
|  +-------------------------------------------+|
|                                               |
|  Yesterday                                    |
|  +-------------------------------------------+|
|  | ⚡ Generated DUST  +50 DUST      Auto     ||
|  |   From NIGHT holdings                    ||
|  +-------------------------------------------+|
+-----------------------------------------------+
```

### Implementation

```tsx
// src/pages/history.tsx
import { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, Zap, ExternalLink, Check, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PrivacyIndicator } from '@/components/wallet';
import { clsx } from 'clsx';

type FilterTab = 'all' | 'night' | 'dust' | 'generated';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'generation';
  tokenType: 'night' | 'dust';
  amount: number;
  counterparty?: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  hash: string;
  isPrivate: boolean;
}

// Mock data
const mockTransactions: Transaction[] = [
  { id: '1', type: 'receive', tokenType: 'night', amount: 1.0, counterparty: '0x1234567890abcdef', timestamp: new Date('2024-12-25T14:30:00'), status: 'confirmed', hash: '0xabc123', isPrivate: false },
  { id: '2', type: 'send', tokenType: 'dust', amount: 50, counterparty: undefined, timestamp: new Date('2024-12-25T11:15:00'), status: 'confirmed', hash: '0xdef456', isPrivate: true },
  { id: '3', type: 'generation', tokenType: 'dust', amount: 50, timestamp: new Date('2024-12-24T00:00:00'), status: 'confirmed', hash: '0xghi789', isPrivate: false },
  { id: '4', type: 'send', tokenType: 'night', amount: 0.5, counterparty: '0xfedcba0987654321', timestamp: new Date('2024-12-23T16:45:00'), status: 'confirmed', hash: '0xjkl012', isPrivate: false },
  { id: '5', type: 'receive', tokenType: 'dust', amount: 100, timestamp: new Date('2024-12-23T09:00:00'), status: 'pending', hash: '0xmno345', isPrivate: true },
];

function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  transactions.forEach((tx) => {
    const dateStr = tx.timestamp.toDateString();
    const label = dateStr === today ? 'Today' : dateStr === yesterday ? 'Yesterday' : tx.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  });

  return groups;
}

export function HistoryPage() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const filtered = mockTransactions.filter((tx) => {
    if (filter === 'night' && tx.tokenType !== 'night') return false;
    if (filter === 'dust' && tx.tokenType !== 'dust') return false;
    if (filter === 'generated' && tx.type !== 'generation') return false;
    if (search && !tx.hash.includes(search) && !tx.counterparty?.includes(search)) return false;
    return true;
  });

  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Transaction History</h1>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'night', 'dust', 'generated'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === tab
                ? 'bg-midnight-700 text-midnight-50'
                : 'text-midnight-400 hover:text-midnight-200 hover:bg-midnight-800'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-500" />
          <Input
            placeholder="Search hash or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-[200px]"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-midnight-400 mb-3">{date}</h3>
            <Card>
              <CardContent className="divide-y divide-midnight-700 p-0">
                {txs.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12 text-midnight-400">
            No transactions found
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionItem({ transaction: tx }: { transaction: Transaction }) {
  const iconConfig = {
    send: { icon: ArrowUpRight, bg: 'bg-night/20', color: 'text-night' },
    receive: { icon: ArrowDownLeft, bg: 'bg-dust/20', color: 'text-dust' },
    generation: { icon: Zap, bg: 'bg-shield/20', color: 'text-shield' },
  };
  const config = iconConfig[tx.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-midnight-800/50 transition-colors">
      <div className={clsx('p-2.5 rounded-lg', config.bg)}>
        <Icon size={18} className={config.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-midnight-100">
            {tx.type === 'receive' ? 'Received' : tx.type === 'send' ? 'Sent' : 'Generated'} {tx.tokenType.toUpperCase()}
          </span>
          <PrivacyIndicator isPrivate={tx.isPrivate} size="sm" showLabel={false} />
        </div>
        <p className="text-sm text-midnight-400 truncate">
          {tx.type === 'generation' ? 'From NIGHT holdings' :
           tx.counterparty ? `${tx.type === 'send' ? 'To' : 'From'}: ${tx.counterparty.slice(0, 10)}...` :
           'Hidden'}
        </p>
      </div>

      <div className="text-right">
        <p className={clsx(
          'font-mono font-medium',
          tx.type === 'send' ? 'text-red-400' : 'text-dust'
        )}>
          {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.tokenType.toUpperCase()}
        </p>
        <div className="flex items-center justify-end gap-1 text-sm text-midnight-400">
          {tx.status === 'pending' ? <Clock size={12} /> : <Check size={12} className="text-dust" />}
          <span>{tx.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      </div>

      <button className="p-2 text-midnight-500 hover:text-midnight-300">
        <ExternalLink size={16} />
      </button>
    </div>
  );
}
```

## Screen 2: Address Management

### Implementation

```tsx
// src/pages/addresses.tsx
import { useState } from 'react';
import { Copy, Check, Eye, EyeOff, ExternalLink, AlertTriangle, QrCode, Coins, Shield, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clsx } from 'clsx';

interface WalletAddress {
  type: 'night' | 'shield' | 'dust';
  address: string;
  label: string;
  description: string;
  isHidden: boolean;
}

const addresses: WalletAddress[] = [
  { type: 'night', address: '0x1234567890abcdef1234567890abcdef12345678', label: 'NIGHT Address', description: 'Unshielded / Public', isHidden: false },
  { type: 'shield', address: '0xfedcba0987654321fedcba0987654321fedcba09', label: 'Shield Address', description: 'Shielded / Private', isHidden: true },
  { type: 'dust', address: '0xfedcba0987654321fedcba0987654321fedcba09', label: 'DUST Recipient', description: 'Currently: Shield Address', isHidden: true },
];

const iconMap = {
  night: { icon: Coins, color: 'text-night', bg: 'bg-night/20' },
  shield: { icon: Shield, color: 'text-shield', bg: 'bg-shield/20' },
  dust: { icon: Zap, color: 'text-dust', bg: 'bg-dust/20' },
};

export function AddressesPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Address Management</h1>
      <p className="text-midnight-400">Manage your wallet addresses and DUST recipient configuration.</p>

      <div className="space-y-4">
        {addresses.map((addr) => (
          <AddressCard key={addr.type} address={addr} />
        ))}
      </div>

      {/* DUST Recipient Warning */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-500">DUST Recipient Configuration</p>
            <p className="text-sm text-midnight-400 mt-1">
              Changing the DUST recipient will cause existing DUST to decay over 30 days.
              This action cannot be undone.
            </p>
            <Button variant="secondary" size="sm" className="mt-3">
              Change DUST Recipient
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddressCard({ address: addr }: { address: WalletAddress }) {
  const [isRevealed, setIsRevealed] = useState(!addr.isHidden);
  const [copied, setCopied] = useState(false);
  const config = iconMap[addr.type];
  const Icon = config.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(addr.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={clsx('p-3 rounded-lg', config.bg)}>
            <Icon size={24} className={config.color} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-heading font-semibold text-midnight-100">{addr.label}</span>
              <Badge variant={addr.type === 'night' ? 'warning' : 'shield'} size="sm">
                {addr.type === 'night' ? 'Public' : 'Private'}
              </Badge>
            </div>
            <p className="text-sm text-midnight-400 mb-3">{addr.description}</p>

            <div className="flex items-center gap-2">
              <code className="font-mono text-sm text-midnight-300 bg-midnight-900 px-2 py-1 rounded flex-1 truncate">
                {isRevealed ? addr.address : '••••••••••••••••••••••••••••••••••••••••'}
              </code>

              {addr.isHidden && (
                <button
                  onClick={() => setIsRevealed(!isRevealed)}
                  className="p-2 text-midnight-400 hover:text-midnight-200 transition-colors"
                  title={isRevealed ? 'Hide' : 'Reveal'}
                >
                  {isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}

              <button
                onClick={handleCopy}
                className="p-2 text-midnight-400 hover:text-midnight-200 transition-colors"
                title="Copy"
              >
                {copied ? <Check size={18} className="text-dust" /> : <Copy size={18} />}
              </button>

              <button className="p-2 text-midnight-400 hover:text-midnight-200 transition-colors" title="QR Code">
                <QrCode size={18} />
              </button>

              {addr.type === 'night' && (
                <button className="p-2 text-midnight-400 hover:text-midnight-200 transition-colors" title="View on Explorer">
                  <ExternalLink size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Screen 3: DUST Management

### Implementation

```tsx
// src/pages/dust.tsx
import { Zap, TrendingUp, TrendingDown, AlertTriangle, Info, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { clsx } from 'clsx';

// Mock data
const dustData = {
  current: 800,
  max: 1000,
  generationRate: 50,
  status: 'active' as const,
  nightBalance: 2.5,
  decayDays: 30,
  generationHistory: [
    { date: 'Dec 25', amount: 50, total: 800 },
    { date: 'Dec 24', amount: 50, total: 750 },
    { date: 'Dec 23', amount: 50, total: 700 },
    { date: 'Dec 22', amount: 50, total: 650 },
    { date: 'Dec 21', amount: 50, total: 600 },
  ],
};

export function DustPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">DUST Management</h1>

      {/* Main Capacity Card */}
      <Card className="bg-gradient-to-br from-midnight-800 to-midnight-900 border-dust/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-dust/20">
              <Zap size={24} className="text-dust" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-midnight-50">DUST Capacity</h2>
              <p className="text-sm text-midnight-400">Transaction fuel for private operations</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-end justify-between mb-2">
              <span className="text-4xl font-heading font-bold text-dust-light">
                {dustData.current.toLocaleString()}
              </span>
              <span className="text-midnight-400">/ {dustData.max.toLocaleString()} DUST</span>
            </div>
            <ProgressBar value={dustData.current} max={dustData.max} variant="dust" size="lg" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-midnight-800/50">
              <p className="text-2xl font-semibold text-midnight-100">+{dustData.generationRate}</p>
              <p className="text-xs text-midnight-400">per day</p>
            </div>
            <div className="p-3 rounded-lg bg-midnight-800/50">
              <p className="text-2xl font-semibold text-midnight-100">{dustData.nightBalance}</p>
              <p className="text-xs text-midnight-400">NIGHT staked</p>
            </div>
            <div className="p-3 rounded-lg bg-midnight-800/50">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp size={20} className="text-dust" />
                <span className="text-lg font-semibold text-dust">Active</span>
              </div>
              <p className="text-xs text-midnight-400">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-midnight-400">Source NIGHT Balance</span>
            <span className="font-semibold text-midnight-100">{dustData.nightBalance} NIGHT</span>
          </div>
          <div className="border-t border-midnight-700" />
          <div className="flex items-center justify-between py-2">
            <span className="text-midnight-400">Generation Rate</span>
            <span className="font-semibold text-dust">{dustData.generationRate} DUST / 24h</span>
          </div>
          <div className="border-t border-midnight-700" />
          <div className="flex items-center justify-between py-2">
            <span className="text-midnight-400">DUST Cap</span>
            <span className="font-semibold text-midnight-100">{dustData.max.toLocaleString()} DUST</span>
          </div>
          <div className="border-t border-midnight-700" />
          <div className="flex items-center justify-between py-2">
            <span className="text-midnight-400">Recipient Address</span>
            <span className="font-mono text-sm text-midnight-300">Shield Address</span>
          </div>
        </CardContent>
      </Card>

      {/* Decay Information */}
      <Card className="border-yellow-500/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            <CardTitle>Decay Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-midnight-400 text-sm mb-4">
            If your DUST becomes orphaned (disconnected from NIGHT holdings), it will begin to decay.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-midnight-800">
              <p className="text-sm text-midnight-400 mb-1">Decay Period</p>
              <p className="text-xl font-semibold text-midnight-100">{dustData.decayDays} days</p>
            </div>
            <div className="p-4 rounded-lg bg-midnight-800">
              <p className="text-sm text-midnight-400 mb-1">Decay Rate</p>
              <p className="text-xl font-semibold text-midnight-100">~3.3%/day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation History */}
      <Card>
        <CardHeader>
          <CardTitle>Generation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dustData.generationHistory.map((entry) => (
              <div key={entry.date} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-dust/20">
                    <Zap size={14} className="text-dust" />
                  </div>
                  <div>
                    <p className="text-midnight-100">+{entry.amount} DUST generated</p>
                    <p className="text-sm text-midnight-400">{entry.date}</p>
                  </div>
                </div>
                <span className="text-midnight-300">Total: {entry.total}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Screen 4: Settings

### Implementation

```tsx
// src/pages/settings.tsx
import { useState } from 'react';
import { Shield, Lock, Eye, Bell, Globe, Moon, Sun, Info, ExternalLink, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clsx } from 'clsx';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

function SettingItem({ icon, title, description, action, onClick }: SettingItemProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={clsx(
        'flex items-center gap-4 p-4 w-full text-left',
        onClick && 'hover:bg-midnight-800/50 transition-colors cursor-pointer'
      )}
    >
      <div className="p-2 rounded-lg bg-midnight-700 text-midnight-300">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-midnight-100">{title}</p>
        <p className="text-sm text-midnight-400 truncate">{description}</p>
      </div>
      {action || (onClick && <ChevronRight size={18} className="text-midnight-500" />)}
    </Wrapper>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={clsx(
        'w-11 h-6 rounded-full transition-colors relative',
        enabled ? 'bg-dust' : 'bg-midnight-600'
      )}
    >
      <span
        className={clsx(
          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export function SettingsPage() {
  const [hideBalances, setHideBalances] = useState(false);
  const [hideAddresses, setHideAddresses] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Settings</h1>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={18} />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-midnight-700 p-0">
          <SettingItem
            icon={<Lock size={18} />}
            title="Change Password"
            description="Update your wallet password"
            onClick={() => {}}
          />
          <SettingItem
            icon={<Shield size={18} />}
            title="Recovery Phrase"
            description="View your 24-word recovery phrase"
            action={<Badge variant="warning">Protected</Badge>}
            onClick={() => {}}
          />
          <SettingItem
            icon={<Lock size={18} />}
            title="Auto-Lock"
            description="Lock wallet after 15 minutes"
            onClick={() => {}}
          />
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye size={18} />
            Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-midnight-700 p-0">
          <SettingItem
            icon={<Eye size={18} />}
            title="Hide Balances"
            description="Mask balance values on dashboard"
            action={<ToggleSwitch enabled={hideBalances} onChange={setHideBalances} />}
          />
          <SettingItem
            icon={<Shield size={18} />}
            title="Hide Shield Addresses"
            description="Require click to reveal private addresses"
            action={<ToggleSwitch enabled={hideAddresses} onChange={setHideAddresses} />}
          />
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon size={18} />
            Display
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-midnight-700 p-0">
          <SettingItem
            icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            title="Theme"
            description={theme === 'dark' ? 'Dark mode' : 'Light mode'}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('dark')}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    theme === 'dark' ? 'bg-midnight-700 text-midnight-100' : 'text-midnight-500'
                  )}
                >
                  <Moon size={16} />
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    theme === 'light' ? 'bg-midnight-700 text-midnight-100' : 'text-midnight-500'
                  )}
                >
                  <Sun size={16} />
                </button>
              </div>
            }
          />
          <SettingItem
            icon={<Bell size={18} />}
            title="Notifications"
            description="DUST alerts and transaction updates"
            action={<ToggleSwitch enabled={notifications} onChange={setNotifications} />}
          />
        </CardContent>
      </Card>

      {/* Network */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe size={18} />
            Network
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-midnight-700 p-0">
          <SettingItem
            icon={<Globe size={18} />}
            title="Network"
            description="Midnight Testnet"
            action={<Badge variant="warning">Testnet</Badge>}
            onClick={() => {}}
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info size={18} />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-midnight-700 p-0">
          <SettingItem
            icon={<Info size={18} />}
            title="Midnight Wallet"
            description="Version 0.1.0"
          />
          <SettingItem
            icon={<ExternalLink size={18} />}
            title="Documentation"
            description="docs.midnight.network"
            onClick={() => window.open('https://docs.midnight.network', '_blank')}
          />
          <SettingItem
            icon={<ExternalLink size={18} />}
            title="Support"
            description="Get help with your wallet"
            onClick={() => {}}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="danger" className="w-full">
            Reset Wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Verification

```bash
bun run dev
# Test all screens:
# 1. /history - filter tabs work, search filters results
# 2. /addresses - reveal/hide works, copy works
# 3. /dust - capacity bar, generation history visible
# 4. /settings - toggles work, navigation between sections
```

## Output

- Transaction History with filtering and grouping
- Address Management with privacy controls
- DUST Management with generation tracking
- Settings with security, privacy, display options
