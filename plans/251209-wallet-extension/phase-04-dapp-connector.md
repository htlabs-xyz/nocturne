# Phase 04: DApp Connector

**Status**: pending | **Priority**: High

## Context Links

- [midnight-dapp-connector.md](../../docs/research/midnight-dapp-connector.md) - API reference
- [dapp-connect-patterns.md](../../docs/research/dapp-connect-patterns.md) - Patterns

## Overview

Implement `window.midnight.nocturne` provider following Midnight DApp Connector API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         DApp Page                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  const wallet = window.midnight.nocturne;                   │
│  await wallet.enable();                                      │
│  const state = await wallet.state();                        │
│                                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Content Script                            │
├─────────────────────────────────────────────────────────────┤
│  window.midnight.nocturne = {                               │
│    isEnabled: () => ...,                                    │
│    enable: () => ...,                                       │
│    state: () => ...,                                        │
│    balanceAndProveTransaction: () => ...,                   │
│    submitTransaction: () => ...,                            │
│    serviceUriConfig: () => ...,                             │
│  }                                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ chrome.runtime.sendMessage
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Worker                             │
├─────────────────────────────────────────────────────────────┤
│  MessageRouter handles DApp requests                         │
│  Opens popup for user approval                               │
└─────────────────────────────────────────────────────────────┘
```

## DAppConnectorAPI Implementation

### Step 1: Type Definitions

```typescript
// src/shared/types/dapp.ts
export interface DAppConnectorAPI {
  isEnabled(): Promise<boolean>;
  enable(): Promise<void>;
  state(): Promise<WalletState>;
  balanceTransaction(tx: UnprovenTransaction, newCoins?: Coin[]): Promise<BalancedTransaction>;
  proveTransaction(tx: BalancedTransaction): Promise<ProvenTransaction>;
  balanceAndProveTransaction(tx: UnprovenTransaction): Promise<ProvenTransaction>;
  submitTransaction(tx: ProvenTransaction): Promise<string>;
  serviceUriConfig(): Promise<ServiceUriConfig>;
}

export interface WalletState {
  address: string;
  shieldAddress: string;
  coinPublicKey: string;
  encryptionPublicKey: string;
  apiVersion: string;
}

export interface ServiceUriConfig {
  indexer: string;
  node: string;
  proofServer: string;
}

export interface ConnectionRequest {
  origin: string;
  favicon?: string;
  title?: string;
}

export interface TransactionRequest {
  origin: string;
  tx: unknown;
  type: 'balance' | 'prove' | 'submit';
}
```

### Step 2: Inpage Script (Injected)

```typescript
// src/content/inpage.ts
declare global {
  interface Window {
    midnight?: {
      nocturne?: DAppConnectorAPI;
    };
  }
}

class NocturneProvider implements DAppConnectorAPI {
  private connected = false;
  private requestId = 0;

  private request<T>(method: string, params?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;

      const handler = (event: MessageEvent) => {
        if (event.data?.type === 'NOCTURNE_RESPONSE' && event.data.id === id) {
          window.removeEventListener('message', handler);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      window.addEventListener('message', handler);
      window.postMessage({ type: 'NOCTURNE_REQUEST', id, method, params }, '*');
    });
  }

  async isEnabled(): Promise<boolean> {
    return this.request('isEnabled');
  }

  async enable(): Promise<void> {
    await this.request('enable');
    this.connected = true;
  }

  async state(): Promise<WalletState> {
    return this.request('state');
  }

  async balanceTransaction(tx: unknown, newCoins?: unknown[]): Promise<unknown> {
    return this.request('balanceTransaction', { tx, newCoins });
  }

  async proveTransaction(tx: unknown): Promise<unknown> {
    return this.request('proveTransaction', { tx });
  }

  async balanceAndProveTransaction(tx: unknown): Promise<unknown> {
    return this.request('balanceAndProveTransaction', { tx });
  }

  async submitTransaction(tx: unknown): Promise<string> {
    return this.request('submitTransaction', { tx });
  }

  async serviceUriConfig(): Promise<ServiceUriConfig> {
    return this.request('serviceUriConfig');
  }
}

// Inject provider
if (typeof window.midnight === 'undefined') {
  window.midnight = {};
}
window.midnight.nocturne = new NocturneProvider();

// Announce provider
window.dispatchEvent(new CustomEvent('midnight:announceProvider', {
  detail: { name: 'nocturne', provider: window.midnight.nocturne }
}));
```

### Step 3: Content Script Bridge

```typescript
// src/content/index.ts
function injectScript(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inpage.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

injectScript();

window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== 'NOCTURNE_REQUEST') return;

  const { id, method, params } = event.data;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'DAPP_REQUEST',
      payload: { method, params, origin: window.location.origin }
    });

    window.postMessage({
      type: 'NOCTURNE_RESPONSE',
      id,
      result: response.data,
      error: response.error
    }, '*');
  } catch (error) {
    window.postMessage({
      type: 'NOCTURNE_RESPONSE',
      id,
      error: (error as Error).message
    }, '*');
  }
});
```

### Step 4: Background DApp Handler

```typescript
// src/background/dappHandler.ts
import { WalletManager } from './wallet';

const NETWORK_CONFIG = {
  indexer: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
  node: 'https://rpc.testnet-02.midnight.network',
  proofServer: 'https://lace-dev.proof-pub.stg.midnight.tools',
};

export class DAppHandler {
  private wallet: WalletManager;
  private connectedSites = new Map<string, boolean>();
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();

  constructor(wallet: WalletManager) {
    this.wallet = wallet;
  }

  async handleRequest(method: string, params: unknown, origin: string): Promise<unknown> {
    switch (method) {
      case 'isEnabled':
        return this.connectedSites.has(origin);

      case 'enable':
        return this.requestConnection(origin);

      case 'state':
        this.requireConnection(origin);
        return this.getWalletState();

      case 'balanceTransaction':
        this.requireConnection(origin);
        return this.requestApproval('balance', params, origin);

      case 'proveTransaction':
        this.requireConnection(origin);
        return this.requestApproval('prove', params, origin);

      case 'balanceAndProveTransaction':
        this.requireConnection(origin);
        return this.requestApproval('balanceAndProve', params, origin);

      case 'submitTransaction':
        this.requireConnection(origin);
        return this.requestApproval('submit', params, origin);

      case 'serviceUriConfig':
        return NETWORK_CONFIG;

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  private requireConnection(origin: string): void {
    if (!this.connectedSites.has(origin)) {
      throw new Error('Site not connected');
    }
  }

  private async requestConnection(origin: string): Promise<void> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      chrome.windows.create({
        url: chrome.runtime.getURL(`popup.html#/connect?requestId=${requestId}&origin=${encodeURIComponent(origin)}`),
        type: 'popup',
        width: 380,
        height: 620,
        focused: true,
      });
    });
  }

  private async requestApproval(type: string, params: unknown, origin: string): Promise<unknown> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      chrome.windows.create({
        url: chrome.runtime.getURL(`popup.html#/approve?requestId=${requestId}&type=${type}&origin=${encodeURIComponent(origin)}`),
        type: 'popup',
        width: 380,
        height: 620,
        focused: true,
      });
    });
  }

  approveConnection(requestId: string, origin: string): void {
    this.connectedSites.set(origin, true);
    this.pendingRequests.get(requestId)?.resolve();
    this.pendingRequests.delete(requestId);
  }

  rejectConnection(requestId: string): void {
    this.pendingRequests.get(requestId)?.reject(new Error('User rejected connection'));
    this.pendingRequests.delete(requestId);
  }

  private async getWalletState(): Promise<unknown> {
    const state = await this.wallet.getState();
    return {
      address: state?.unshielded?.address ?? '',
      shieldAddress: state?.shielded?.address ?? '',
      coinPublicKey: '',
      encryptionPublicKey: '',
      apiVersion: '3.0.0',
    };
  }
}
```

### Step 5: Connection Request UI

```tsx
// src/popup/pages/DApp/ConnectRequest.tsx
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function ConnectRequest() {
  const [params] = useSearchParams();
  const origin = params.get('origin') ?? 'Unknown';
  const requestId = params.get('requestId') ?? '';

  const handleApprove = async () => {
    await chrome.runtime.sendMessage({
      type: 'APPROVE_CONNECTION',
      payload: { requestId, origin }
    });
    window.close();
  };

  const handleReject = async () => {
    await chrome.runtime.sendMessage({
      type: 'REJECT_CONNECTION',
      payload: { requestId }
    });
    window.close();
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h1 className="text-xl font-bold text-white text-center mb-4">
        Connection Request
      </h1>

      <Card className="mb-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-midnight-500 rounded-full mx-auto mb-3 flex items-center justify-center">
            🌐
          </div>
          <p className="text-white font-medium">{new URL(origin).hostname}</p>
          <p className="text-text-secondary text-sm mt-1">
            wants to connect to your wallet
          </p>
        </div>
      </Card>

      <div className="space-y-2">
        <p className="text-text-secondary text-sm">This site will be able to:</p>
        <ul className="text-sm text-white space-y-1">
          <li>✓ View your wallet address</li>
          <li>✓ Request transaction approval</li>
        </ul>
      </div>

      <div className="mt-auto flex gap-3">
        <Button variant="secondary" onClick={handleReject} className="flex-1">
          Reject
        </Button>
        <Button variant="primary" onClick={handleApprove} className="flex-1">
          Connect
        </Button>
      </div>
    </div>
  );
}
```

## Todo List

- [ ] Create DApp type definitions
- [ ] Create inpage.ts provider implementation
- [ ] Create content script bridge
- [ ] Add inpage.js to webpack config
- [ ] Update manifest for web_accessible_resources
- [ ] Implement DAppHandler in background
- [ ] Create ConnectRequest UI
- [ ] Create TransactionApproval UI
- [ ] Test with sample DApp
- [ ] Handle popup close (rejection)

## Success Criteria

- [ ] `window.midnight.nocturne` available on all pages
- [ ] `enable()` opens connection popup
- [ ] `state()` returns wallet info after connection
- [ ] Transaction requests show approval UI
- [ ] Connected sites persist in storage
