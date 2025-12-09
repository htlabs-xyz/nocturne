# Phase 02: UI Components

**Status**: ⚠️ conditional-approval | **Priority**: High | **Review**: [code-reviewer-251209-phase-02-ui-review.md](./reports/code-reviewer-251209-phase-02-ui-review.md)

## Context Links

- [phantom-wallet-ux.md](../../docs/research/researcher-251209-phantom-wallet-ux.md) - Phantom UX patterns
- [tech-stack.md](../../docs/tech-stack.md) - React 19, Tailwind 4

## Overview

Build all UI screens and components first (Phantom-style dark theme). No backend integration yet - use mock data.

## Screen Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ONBOARDING FLOW                        │
├─────────────────────────────────────────────────────────────┤
│  Welcome → Create/Import → Seed Phrase → Password → Done   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       MAIN WALLET                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Header: Network | Account | Settings               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Balance Card                                        │   │
│  │  ├─ Total: $1,234.56                                │   │
│  │  ├─ Shielded: ●●●●●                                 │   │
│  │  ├─ Unshielded: 1,000 NIGHT                         │   │
│  │  └─ Dust: 50.5 tDUST                                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Actions: [Send] [Receive] [Swap]                   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Token List                                          │   │
│  │  ├─ NIGHT  ████████░░  1,000                        │   │
│  │  ├─ tDUST  ██░░░░░░░░  50.5                         │   │
│  │  └─ [Custom tokens...]                              │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Recent Activity                                     │   │
│  │  ├─ ↑ Sent 100 NIGHT - 2h ago                       │   │
│  │  └─ ↓ Received 500 NIGHT - 1d ago                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Bottom Nav: [Wallet] [Activity] [Settings]         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       SEND FLOW                             │
├─────────────────────────────────────────────────────────────┤
│  Select Token → Enter Amount → Enter Address → Confirm     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     DAPP CONNECTION                         │
├─────────────────────────────────────────────────────────────┤
│  Connection Request → Approve/Reject → Connected Sites     │
└─────────────────────────────────────────────────────────────┘
```

## Color Palette (Phantom-inspired)

```css
/* Dark theme */
--bg-primary: #0a0a0f;
--bg-secondary: #12121a;
--bg-tertiary: #1a1a24;
--bg-card: #22222e;

--text-primary: #ffffff;
--text-secondary: #a0a0b0;
--text-muted: #6b6b7b;

--accent-purple: #7c3aed;
--accent-purple-hover: #6d28d9;
--accent-green: #22c55e;
--accent-red: #ef4444;

--border: #2a2a38;
```

## Component Structure

```
apps/browser-extension-wallet/src/popup/
├── pages/
│   ├── Onboarding/
│   │   ├── Welcome.tsx
│   │   ├── CreateWallet.tsx
│   │   ├── ImportWallet.tsx
│   │   ├── SeedPhrase.tsx
│   │   └── SetPassword.tsx
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── BalanceCard.tsx
│   │   └── TokenList.tsx
│   ├── Send/
│   │   ├── SelectToken.tsx
│   │   ├── EnterAmount.tsx
│   │   ├── EnterAddress.tsx
│   │   └── ConfirmSend.tsx
│   ├── Receive/
│   │   └── Receive.tsx
│   ├── Activity/
│   │   └── Activity.tsx
│   └── Settings/
│       ├── Settings.tsx
│       ├── ConnectedSites.tsx
│       └── Security.tsx
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Header.tsx
│   ├── BottomNav.tsx
│   ├── TokenIcon.tsx
│   ├── AddressDisplay.tsx
│   ├── QRCode.tsx
│   └── Spinner.tsx
├── stores/
│   └── uiStore.ts
└── styles/
    └── globals.css
```

## Implementation Steps

### Step 1: Tailwind 4 Setup

```css
/* src/popup/styles/globals.css */
@import "tailwindcss";

@theme {
  --color-midnight-900: #0a0a0f;
  --color-midnight-800: #12121a;
  --color-midnight-700: #1a1a24;
  --color-midnight-600: #22222e;
  --color-midnight-500: #2a2a38;

  --color-accent-purple: #7c3aed;
  --color-accent-green: #22c55e;
  --color-accent-red: #ef4444;

  --font-sans: "Inter", system-ui, sans-serif;
}
```

### Step 2: Base Components

```tsx
// src/popup/components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  onClick,
  disabled
}: ButtonProps) {
  const base = 'font-medium rounded-xl transition-all duration-200';

  const variants = {
    primary: 'bg-accent-purple hover:bg-accent-purple/90 text-white',
    secondary: 'bg-midnight-600 hover:bg-midnight-500 text-white',
    ghost: 'bg-transparent hover:bg-midnight-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
}
```

```tsx
// src/popup/components/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-midnight-600 rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}
```

### Step 3: Dashboard Page

```tsx
// src/popup/pages/Dashboard/Dashboard.tsx
import { BalanceCard } from './BalanceCard';
import { TokenList } from './TokenList';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

export function Dashboard() {
  return (
    <div className="flex flex-col h-[600px] w-[360px] bg-midnight-900">
      <Header />

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <BalanceCard />

        <div className="flex gap-2">
          <ActionButton icon="↑" label="Send" to="/send" />
          <ActionButton icon="↓" label="Receive" to="/receive" />
          <ActionButton icon="⇄" label="Swap" to="/swap" />
        </div>

        <TokenList />
      </main>

      <BottomNav />
    </div>
  );
}
```

### Step 4: Balance Card

```tsx
// src/popup/pages/Dashboard/BalanceCard.tsx
import { Card } from '@/components/Card';

interface BalanceCardProps {
  totalUsd?: string;
  shielded?: { hidden: boolean; amount: string };
  unshielded?: { token: string; amount: string };
  dust?: { amount: string };
}

export function BalanceCard({
  totalUsd = '$0.00',
  shielded = { hidden: true, amount: '●●●●●' },
  unshielded = { token: 'NIGHT', amount: '0' },
  dust = { amount: '0' }
}: BalanceCardProps) {
  return (
    <Card className="bg-gradient-to-br from-accent-purple/20 to-midnight-600">
      <div className="text-center mb-4">
        <p className="text-text-secondary text-sm">Total Balance</p>
        <h1 className="text-3xl font-bold text-white">{totalUsd}</h1>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <p className="text-text-muted">Shielded</p>
          <p className="text-white font-medium">{shielded.hidden ? '●●●●●' : shielded.amount}</p>
        </div>
        <div className="text-center">
          <p className="text-text-muted">Unshielded</p>
          <p className="text-white font-medium">{unshielded.amount} {unshielded.token}</p>
        </div>
        <div className="text-center">
          <p className="text-text-muted">Dust</p>
          <p className="text-white font-medium">{dust.amount} tDUST</p>
        </div>
      </div>
    </Card>
  );
}
```

### Step 5: Mock Data Store

```tsx
// src/popup/stores/mockData.ts
export const mockWallet = {
  address: 'mn_shield1abc...xyz',
  balances: {
    shielded: { amount: '500', usd: '500.00' },
    unshielded: { token: 'NIGHT', amount: '1000', usd: '1000.00' },
    dust: { amount: '50.5', usd: '0.00' },
  },
  totalUsd: '$1,500.00',
};

export const mockTokens = [
  { symbol: 'NIGHT', name: 'Night Token', balance: '1000', usd: '$1000.00', icon: '🌙' },
  { symbol: 'tDUST', name: 'Test Dust', balance: '50.5', usd: '$0.00', icon: '✨' },
];

export const mockActivity = [
  { type: 'send', amount: '100', token: 'NIGHT', to: 'mn_...abc', time: '2h ago' },
  { type: 'receive', amount: '500', token: 'NIGHT', from: 'mn_...xyz', time: '1d ago' },
];
```

## Todo List

- [x] Setup Tailwind 4 with dark theme (using Tailwind 3.4)
- [x] Create base components (Button, Input, Card, Modal, Spinner)
- [x] Create Header with network/account selector
- [x] Create BottomNav component
- [x] Build Welcome/Onboarding screens
- [x] Build Dashboard with BalanceCard
- [x] Build TokenList component
- [x] Build Send flow (4 screens)
- [x] Build Receive screen with QR code (mock QR)
- [x] Build Activity page
- [x] Build Settings pages
- [~] Add page transitions/animations (basic only)
- [ ] Test responsive behavior in 360x600 popup

## Critical Fixes Required (Before Approval)

- [ ] **CRITICAL-01**: Fix seed phrase clipboard security (add warning, auto-clear)
- [ ] **CRITICAL-02**: Strengthen password validation (12+ chars, complexity rules)
- [ ] **HIGH-01**: Add input sanitization to all user inputs
- [ ] **HIGH-02**: Implement ErrorBoundary wrapper around App
- [ ] **HIGH-03**: Fix Modal useEffect memory leak

## Success Criteria

- [ ] All screens render with mock data
- [ ] Navigation works between all pages
- [ ] Dark theme consistent across all screens
- [ ] Popup size fixed at 360x600px
- [ ] No console errors
- [ ] Smooth transitions between screens
