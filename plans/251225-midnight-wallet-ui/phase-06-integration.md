# Phase 06: SDK Integration

## Objective

Connect wallet UI to the Midnight Wallet SDK, implement state management, and wire up real data flows.

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                    Wallet UI (React)                       │
├────────────────────────────────────────────────────────────┤
│  Components        │   Stores (Zustand)    │   Hooks       │
│  - Pages           │   - useWalletStore    │   - useWallet │
│  - UI Components   │   - useTransactions   │   - useDust   │
│  - Layout          │   - useSettings       │   - useTx     │
├────────────────────────────────────────────────────────────┤
│                     SDK Adapter Layer                      │
│  - walletAdapter.ts (wraps SDK with React-friendly API)   │
├────────────────────────────────────────────────────────────┤
│                  Midnight Wallet SDK                       │
│  - Shielded Wallet │ Dust Wallet │ Unshielded Wallet      │
│  - WalletFacade                                           │
└────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── stores/
│   ├── wallet-store.ts       # Main wallet state
│   ├── transaction-store.ts  # Transaction history
│   └── settings-store.ts     # User preferences
├── hooks/
│   ├── use-wallet.ts         # Wallet state hook
│   ├── use-dust.ts           # DUST-specific hook
│   └── use-transactions.ts   # Transaction hook
├── adapters/
│   └── wallet-adapter.ts     # SDK adapter layer
└── types/
    ├── wallet.ts             # Updated with SDK types
    └── sdk.ts                # SDK type exports
```

## Implementation Steps

### Step 1: Wallet Store (Zustand)

```tsx
// src/stores/wallet-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AddressType, DustStatus } from '@/types/wallet';

interface WalletState {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Wallet info
  walletName: string;
  network: 'mainnet' | 'testnet';

  // Addresses
  addresses: {
    night: string | null;
    shield: string | null;
    dustRecipient: string | null;
  };

  // Balances
  balances: {
    night: number;
    nightUsd: number;
    dust: number;
    dustMax: number;
    dustGenerationRate: number;
    dustStatus: DustStatus;
  };

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
  setNetwork: (network: 'mainnet' | 'testnet') => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isLoading: false,
      error: null,
      walletName: 'Midnight Wallet',
      network: 'testnet',
      addresses: {
        night: null,
        shield: null,
        dustRecipient: null,
      },
      balances: {
        night: 0,
        nightUsd: 0,
        dust: 0,
        dustMax: 0,
        dustGenerationRate: 0,
        dustStatus: 'paused',
      },

      // Actions
      connect: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual SDK connection
          // const wallet = await WalletAdapter.connect();
          await new Promise((r) => setTimeout(r, 1000)); // Simulate

          set({
            isConnected: true,
            isLoading: false,
            addresses: {
              night: '0x1234567890abcdef1234567890abcdef12345678',
              shield: '0xfedcba0987654321fedcba0987654321fedcba09',
              dustRecipient: '0xfedcba0987654321fedcba0987654321fedcba09',
            },
            balances: {
              night: 2.5,
              nightUsd: 5000,
              dust: 800,
              dustMax: 1000,
              dustGenerationRate: 50,
              dustStatus: 'active',
            },
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      disconnect: () => {
        set({
          isConnected: false,
          addresses: { night: null, shield: null, dustRecipient: null },
          balances: { night: 0, nightUsd: 0, dust: 0, dustMax: 0, dustGenerationRate: 0, dustStatus: 'paused' },
        });
      },

      refreshBalances: async () => {
        if (!get().isConnected) return;
        // TODO: Fetch from SDK
        // const balances = await WalletAdapter.getBalances();
        // set({ balances });
      },

      setNetwork: (network) => {
        set({ network });
        // TODO: Reconnect to different network
      },
    }),
    {
      name: 'midnight-wallet-storage',
      partialize: (state) => ({
        walletName: state.walletName,
        network: state.network,
      }),
    }
  )
);
```

### Step 2: Transaction Store

```tsx
// src/stores/transaction-store.ts
import { create } from 'zustand';
import type { Transaction, TransactionStatus } from '@/types/wallet';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;

  // Actions
  fetchTransactions: () => Promise<void>;
  addTransaction: (tx: Transaction) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus) => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      // TODO: Replace with SDK call
      // const txs = await WalletAdapter.getTransactionHistory();

      // Mock data for now
      const mockTxs: Transaction[] = [
        {
          id: '1',
          type: 'receive',
          tokenType: 'night',
          amount: 1.0,
          from: '0x1234567890abcdef',
          timestamp: new Date(),
          status: 'confirmed',
          hash: '0xabc123',
          isPrivate: false,
        },
      ];

      set({ transactions: mockTxs, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  addTransaction: (tx) => {
    set((state) => ({
      transactions: [tx, ...state.transactions],
    }));
  },

  updateTransactionStatus: (id, status) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, status } : tx
      ),
    }));
  },
}));
```

### Step 3: Settings Store

```tsx
// src/stores/settings-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Privacy
  hideBalances: boolean;
  hideShieldAddresses: boolean;

  // Display
  theme: 'dark' | 'light' | 'system';
  notifications: boolean;

  // Actions
  setHideBalances: (hide: boolean) => void;
  setHideShieldAddresses: (hide: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setNotifications: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hideBalances: false,
      hideShieldAddresses: true,
      theme: 'dark',
      notifications: true,

      setHideBalances: (hide) => set({ hideBalances: hide }),
      setHideShieldAddresses: (hide) => set({ hideShieldAddresses: hide }),
      setTheme: (theme) => set({ theme }),
      setNotifications: (enabled) => set({ notifications: enabled }),
    }),
    {
      name: 'midnight-wallet-settings',
    }
  )
);
```

### Step 4: SDK Adapter Layer

```tsx
// src/adapters/wallet-adapter.ts
// This file will wrap the actual SDK when available

import type { Transaction, WalletAddress, TokenBalance } from '@/types/wallet';

/**
 * WalletAdapter bridges React UI with Midnight Wallet SDK.
 *
 * The SDK uses Effect-based patterns (streams, SubscriptionRef).
 * This adapter converts those to React-friendly patterns.
 */
export class WalletAdapter {
  private static instance: WalletAdapter | null = null;

  // Singleton pattern
  static getInstance(): WalletAdapter {
    if (!this.instance) {
      this.instance = new WalletAdapter();
    }
    return this.instance;
  }

  /**
   * Initialize wallet from seed phrase or existing credentials
   */
  async connect(seedPhrase?: string): Promise<void> {
    // TODO: Integrate with actual SDK
    // import { WalletBuilder } from '@midnight-ntwrk/wallet';
    // const wallet = await WalletBuilder.build({ seedPhrase });

    console.log('[WalletAdapter] Connecting to wallet...');
    // Simulate connection delay
    await new Promise((r) => setTimeout(r, 1000));
    console.log('[WalletAdapter] Connected');
  }

  /**
   * Get all wallet addresses
   */
  async getAddresses(): Promise<WalletAddress[]> {
    // TODO: Replace with SDK calls
    // const nightAddress = await wallet.unshielded.getAddress();
    // const shieldAddress = await wallet.shielded.getAddress();

    return [
      { address: '0x1234567890abcdef...', type: 'night', label: 'Main' },
      { address: '0xfedcba0987654321...', type: 'shield', label: 'Shield' },
    ];
  }

  /**
   * Get current balances
   */
  async getBalances(): Promise<TokenBalance> {
    // TODO: Replace with SDK calls
    // const nightBalance = await wallet.unshielded.getBalance();
    // const dustState = await wallet.dust.getState();

    return {
      night: 2.5,
      nightUsd: 5000,
      dust: 800,
      dustMax: 1000,
      dustGenerationRate: 50,
      dustStatus: 'active',
    };
  }

  /**
   * Send NIGHT tokens (unshielded transaction)
   */
  async sendNight(to: string, amount: number, feeSpeed: 'slow' | 'standard' | 'fast'): Promise<string> {
    // TODO: Replace with SDK call
    // const tx = await wallet.unshielded.send({ to, amount, feeSpeed });
    // return tx.hash;

    console.log(`[WalletAdapter] Sending ${amount} NIGHT to ${to}`);
    await new Promise((r) => setTimeout(r, 2000));
    return '0x' + Math.random().toString(16).slice(2);
  }

  /**
   * Send DUST tokens (shielded transaction)
   */
  async sendDust(to: string, amount: number): Promise<string> {
    // TODO: Replace with SDK call
    // const tx = await wallet.shielded.send({ to, amount });
    // return tx.hash;

    console.log(`[WalletAdapter] Sending ${amount} DUST to ${to}`);
    await new Promise((r) => setTimeout(r, 2000));
    return '0x' + Math.random().toString(16).slice(2);
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(limit = 50): Promise<Transaction[]> {
    // TODO: Replace with SDK call
    // const history = await wallet.getHistory({ limit });

    return [];
  }

  /**
   * Subscribe to balance updates
   * Returns cleanup function
   */
  subscribeToBalances(callback: (balances: TokenBalance) => void): () => void {
    // TODO: Replace with SDK stream subscription
    // const subscription = wallet.state$.subscribe(state => {
    //   callback(extractBalances(state));
    // });
    // return () => subscription.unsubscribe();

    // Mock polling for now
    const interval = setInterval(async () => {
      const balances = await this.getBalances();
      callback(balances);
    }, 30000);

    return () => clearInterval(interval);
  }

  /**
   * Change DUST recipient address
   * WARNING: This will cause existing DUST to decay
   */
  async changeDustRecipient(newRecipient: string): Promise<void> {
    // TODO: Replace with SDK call
    // await wallet.dust.designateRecipient(newRecipient);

    console.log(`[WalletAdapter] Changing DUST recipient to ${newRecipient}`);
  }
}

// Export singleton instance
export const walletAdapter = WalletAdapter.getInstance();
```

### Step 5: Custom Hooks

```tsx
// src/hooks/use-wallet.ts
import { useEffect } from 'react';
import { useWalletStore } from '@/stores/wallet-store';

export function useWallet() {
  const store = useWalletStore();

  // Auto-connect on mount if previously connected
  useEffect(() => {
    // Could check localStorage or session for previous connection
  }, []);

  return {
    // State
    isConnected: store.isConnected,
    isLoading: store.isLoading,
    error: store.error,
    walletName: store.walletName,
    network: store.network,
    addresses: store.addresses,
    balances: store.balances,

    // Actions
    connect: store.connect,
    disconnect: store.disconnect,
    refreshBalances: store.refreshBalances,
    setNetwork: store.setNetwork,
  };
}
```

```tsx
// src/hooks/use-dust.ts
import { useWalletStore } from '@/stores/wallet-store';

export function useDust() {
  const balances = useWalletStore((state) => state.balances);

  return {
    current: balances.dust,
    max: balances.dustMax,
    generationRate: balances.dustGenerationRate,
    status: balances.dustStatus,
    percentage: balances.dustMax > 0 ? (balances.dust / balances.dustMax) * 100 : 0,
    isAtCapacity: balances.dust >= balances.dustMax,
    isDecaying: balances.dustStatus === 'decaying',
  };
}
```

```tsx
// src/hooks/use-transactions.ts
import { useEffect } from 'react';
import { useTransactionStore } from '@/stores/transaction-store';

export function useTransactions() {
  const store = useTransactionStore();

  useEffect(() => {
    store.fetchTransactions();
  }, []);

  return {
    transactions: store.transactions,
    isLoading: store.isLoading,
    refresh: store.fetchTransactions,
  };
}
```

### Step 6: Update Dashboard to Use Stores

```tsx
// src/pages/dashboard.tsx (updated)
import { useWallet } from '@/hooks/use-wallet';
import { useDust } from '@/hooks/use-dust';
import { useTransactions } from '@/hooks/use-transactions';
// ... rest of imports

export function DashboardPage() {
  const { isConnected, isLoading, addresses, balances, connect } = useWallet();
  const dust = useDust();
  const { transactions } = useTransactions();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-heading font-semibold text-midnight-100 mb-4">
          Connect Your Wallet
        </h2>
        <Button onClick={connect} loading={isLoading}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card - now using store data */}
      <Card className="bg-gradient-to-br from-midnight-800 to-midnight-900 border-night/30">
        <CardContent className="p-6">
          {/* ... use balances.night, balances.nightUsd, etc. */}
        </CardContent>
      </Card>

      {/* DUST Capacity - using useDust hook */}
      <DustCapacityBar
        current={dust.current}
        max={dust.max}
        generationRate={dust.generationRate}
        status={dust.status}
      />

      {/* ... rest of dashboard using store data */}
    </div>
  );
}
```

### Step 7: Update Send Page to Use Adapter

```tsx
// src/pages/send.tsx (partial update)
import { walletAdapter } from '@/adapters/wallet-adapter';
import { useTransactionStore } from '@/stores/transaction-store';

// In the handleSend function:
const handleSend = async () => {
  setIsSubmitting(true);
  try {
    const hash = tokenType === 'night'
      ? await walletAdapter.sendNight(recipient, parseFloat(amount), feeSpeed)
      : await walletAdapter.sendDust(recipient, parseFloat(amount));

    // Add to transaction store
    useTransactionStore.getState().addTransaction({
      id: hash,
      type: 'send',
      tokenType,
      amount: parseFloat(amount),
      to: recipient,
      timestamp: new Date(),
      status: 'pending',
      hash,
      isPrivate: tokenType === 'dust',
    });

    setStep('success');
  } catch (error) {
    setError((error as Error).message);
  } finally {
    setIsSubmitting(false);
  }
};
```

## SDK Integration Notes

The Midnight Wallet SDK uses Effect-based patterns. Key considerations:

1. **State Streams**: SDK provides `Observable<State>` - use `subscribeToBalances` pattern
2. **Effect Types**: SDK returns `Effect<T>` - need to run with `Effect.runPromise`
3. **SubscriptionRef**: State updates are atomic via SubscriptionRef
4. **Variant System**: SDK supports multiple protocol versions via WalletRuntime

### Example SDK Integration Pattern

```tsx
// When SDK is available:
import { Effect, Stream } from 'effect';
import { WalletBuilder } from '@midnight-ntwrk/wallet';

async function initWallet() {
  const wallet = await Effect.runPromise(
    WalletBuilder.new()
      .withVariant(1, shieldedVariant)
      .build()
  );

  // Subscribe to state changes
  Stream.runForEach(wallet.state, (state) => {
    useWalletStore.getState().updateBalances(extractBalances(state));
  });

  return wallet;
}
```

## Verification

```bash
bun run typecheck
bun run dev

# Test integration:
# 1. Connect wallet (mock for now)
# 2. Dashboard shows store data
# 3. Send transaction updates store
# 4. Transaction appears in history
# 5. Settings persist across refreshes
```

## Next Steps After SDK Integration

1. Replace mock data in adapter with real SDK calls
2. Implement proper error handling for SDK failures
3. Add loading states for async operations
4. Implement real-time balance subscriptions
5. Add transaction status polling/websocket updates
6. Implement seed phrase import/export flows
7. Add hardware wallet support (Ledger/Trezor)

## Output

- Zustand stores for wallet, transactions, settings
- SDK adapter layer (ready for real SDK)
- Custom hooks for components
- Pages updated to use stores
- Persisted settings across sessions
