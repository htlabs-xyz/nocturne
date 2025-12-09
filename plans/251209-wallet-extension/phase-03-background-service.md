# Phase 03: Background Service

**Status**: pending | **Priority**: High

## Context Links

- [chrome-mv3-extension.md](../../docs/research/chrome-mv3-extension.md) - MV3 patterns
- [facade/src/index.ts](../../packages/facade/src/index.ts) - WalletFacade API
- [.env.example](../../.env.example) - Server configuration

## Overview

Implement service worker with WalletFacade integration, encrypted storage, and message passing.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Service Worker (background.ts)             │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ WalletManager  │  │ StorageManager │  │ MessageRouter  │ │
│  │                │  │                │  │                │ │
│  │ - WalletFacade │  │ - Encrypt keys │  │ - popup msgs   │ │
│  │ - Sync state   │  │ - Store state  │  │ - content msgs │ │
│  │ - Sign txs     │  │ - Session mgmt │  │ - RPC handler  │ │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘ │
│          │                   │                   │          │
│          └───────────────────┼───────────────────┘          │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              chrome.storage (encrypted)               │   │
│  │  session: { encryptedSeed, sessionKey }              │   │
│  │  local: { accounts, settings, connectedSites }       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Server Config (from .env.example)

```typescript
const NETWORK_CONFIG = {
  testnet02: {
    indexerHttp: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
    indexerWs: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
    proofServer: 'https://lace-dev.proof-pub.stg.midnight.tools',
    nodeUrl: 'https://rpc.testnet-02.midnight.network',
  }
};
```

## Implementation Steps

### Step 1: Message Types

```typescript
// src/shared/types/messages.ts
export type MessageType =
  | 'WALLET_UNLOCK'
  | 'WALLET_LOCK'
  | 'WALLET_CREATE'
  | 'WALLET_IMPORT'
  | 'GET_STATE'
  | 'SEND_TRANSACTION'
  | 'SIGN_TRANSACTION'
  | 'CONNECT_DAPP'
  | 'DISCONNECT_DAPP'
  | 'GET_CONNECTED_SITES';

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
  id: string;
}

export interface Response<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  id: string;
}
```

### Step 2: Storage Manager

```typescript
// src/background/storage.ts
import { Effect, pipe } from 'effect';

const ENCRYPTION_ALGO = 'AES-GCM';

export class StorageManager {
  private sessionKey: CryptoKey | null = null;

  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: ENCRYPTION_ALGO, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptSeed(seed: string, password: string): Promise<{ encrypted: string; salt: string; iv: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGO, iv },
      key,
      new TextEncoder().encode(seed)
    );

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
    };
  }

  async decryptSeed(encrypted: string, salt: string, iv: string, password: string): Promise<string> {
    const key = await this.deriveKey(
      password,
      Uint8Array.from(atob(salt), c => c.charCodeAt(0))
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGO, iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0)) },
      key,
      Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
    );

    return new TextDecoder().decode(decrypted);
  }

  async saveEncryptedWallet(data: { encrypted: string; salt: string; iv: string }): Promise<void> {
    await chrome.storage.local.set({ encryptedWallet: data });
  }

  async getEncryptedWallet(): Promise<{ encrypted: string; salt: string; iv: string } | null> {
    const result = await chrome.storage.local.get('encryptedWallet');
    return result.encryptedWallet ?? null;
  }

  async saveSessionSeed(seed: string): Promise<void> {
    await chrome.storage.session.set({ seed });
  }

  async getSessionSeed(): Promise<string | null> {
    const result = await chrome.storage.session.get('seed');
    return result.seed ?? null;
  }

  async clearSession(): Promise<void> {
    await chrome.storage.session.clear();
  }
}
```

### Step 3: Wallet Manager

```typescript
// src/background/wallet.ts
import { WalletFacade, FacadeState } from '@midnight-ntwrk/wallet-sdk-facade';
import { Observable, BehaviorSubject } from 'rxjs';
import { StorageManager } from './storage';

const NETWORK_CONFIG = {
  indexerHttp: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
  indexerWs: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
  proofServer: 'https://lace-dev.proof-pub.stg.midnight.tools',
  nodeUrl: 'https://rpc.testnet-02.midnight.network',
};

export class WalletManager {
  private facade: WalletFacade | null = null;
  private storage = new StorageManager();
  private stateSubject = new BehaviorSubject<FacadeState | null>(null);

  get state$(): Observable<FacadeState | null> {
    return this.stateSubject.asObservable();
  }

  get isUnlocked(): boolean {
    return this.facade !== null;
  }

  async createWallet(password: string): Promise<{ seed: string; address: string }> {
    // Generate seed using HD wallet
    const seed = this.generateMnemonic();

    // Encrypt and save
    const encrypted = await this.storage.encryptSeed(seed, password);
    await this.storage.saveEncryptedWallet(encrypted);

    // Initialize wallet
    await this.initializeWallet(seed);

    return { seed, address: this.getAddress() };
  }

  async importWallet(seed: string, password: string): Promise<string> {
    // Validate seed phrase
    if (!this.validateMnemonic(seed)) {
      throw new Error('Invalid seed phrase');
    }

    // Encrypt and save
    const encrypted = await this.storage.encryptSeed(seed, password);
    await this.storage.saveEncryptedWallet(encrypted);

    // Initialize wallet
    await this.initializeWallet(seed);

    return this.getAddress();
  }

  async unlock(password: string): Promise<boolean> {
    const encrypted = await this.storage.getEncryptedWallet();
    if (!encrypted) throw new Error('No wallet found');

    try {
      const seed = await this.storage.decryptSeed(
        encrypted.encrypted,
        encrypted.salt,
        encrypted.iv,
        password
      );

      await this.storage.saveSessionSeed(seed);
      await this.initializeWallet(seed);
      return true;
    } catch {
      throw new Error('Invalid password');
    }
  }

  async lock(): Promise<void> {
    await this.facade?.stop();
    this.facade = null;
    await this.storage.clearSession();
    this.stateSubject.next(null);
  }

  private async initializeWallet(seed: string): Promise<void> {
    // TODO: Initialize WalletFacade with SDK
    // This will be implemented with actual SDK integration

    // Subscribe to state updates
    this.facade?.state().subscribe(state => {
      this.stateSubject.next(state);
    });
  }

  private generateMnemonic(): string {
    // TODO: Use @midnight-ntwrk/wallet-sdk-hd
    return 'mock seed phrase for development';
  }

  private validateMnemonic(seed: string): boolean {
    // TODO: Validate with SDK
    return seed.split(' ').length >= 12;
  }

  private getAddress(): string {
    // TODO: Get from facade state
    return 'mn_shield1...';
  }

  async getState(): Promise<FacadeState | null> {
    return this.stateSubject.getValue();
  }
}
```

### Step 4: Message Router

```typescript
// src/background/messageRouter.ts
import { WalletManager } from './wallet';
import { Message, Response } from '@/shared/types/messages';

export class MessageRouter {
  private wallet = new WalletManager();
  private connectedSites = new Set<string>();

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender)
        .then(sendResponse)
        .catch(err => sendResponse({ success: false, error: err.message, id: message.id }));
      return true;
    });
  }

  private async handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<Response> {
    const { type, payload, id } = message;

    try {
      switch (type) {
        case 'WALLET_CREATE':
          const created = await this.wallet.createWallet(payload.password);
          return { success: true, data: created, id };

        case 'WALLET_IMPORT':
          const address = await this.wallet.importWallet(payload.seed, payload.password);
          return { success: true, data: { address }, id };

        case 'WALLET_UNLOCK':
          await this.wallet.unlock(payload.password);
          return { success: true, id };

        case 'WALLET_LOCK':
          await this.wallet.lock();
          return { success: true, id };

        case 'GET_STATE':
          const state = await this.wallet.getState();
          return { success: true, data: state, id };

        case 'CONNECT_DAPP':
          const origin = sender.origin ?? sender.url;
          if (origin) this.connectedSites.add(origin);
          return { success: true, data: { connected: true }, id };

        case 'DISCONNECT_DAPP':
          const siteOrigin = sender.origin ?? sender.url;
          if (siteOrigin) this.connectedSites.delete(siteOrigin);
          return { success: true, id };

        case 'GET_CONNECTED_SITES':
          return { success: true, data: Array.from(this.connectedSites), id };

        default:
          return { success: false, error: `Unknown message type: ${type}`, id };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message, id };
    }
  }
}
```

### Step 5: Background Entry

```typescript
// src/background/index.ts
import { MessageRouter } from './messageRouter';

const router = new MessageRouter();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Nocturne Wallet installed');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Nocturne Wallet started');
});

// Keep service worker alive for wallet sync
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Ping to keep alive during active sync
  }
});
```

## Todo List

- [ ] Create message type definitions
- [ ] Implement StorageManager with encryption
- [ ] Implement WalletManager shell
- [ ] Implement MessageRouter
- [ ] Setup background entry with listeners
- [ ] Integrate with WalletFacade from SDK
- [ ] Add keep-alive mechanism
- [ ] Test message passing popup ↔ background
- [ ] Test encrypted storage

## Success Criteria

- [ ] Service worker registers without errors
- [ ] Messages route correctly between popup and background
- [ ] Seed phrase encrypted with AES-GCM
- [ ] Session clears on browser close
- [ ] Wallet state observable works
