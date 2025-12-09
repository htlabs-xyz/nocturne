# Midnight DApp Connector API Research

## Overview

Midnight uses a browser-injected provider pattern.
Our wallet injects at `window.midnight.nocturne`.

Reference: https://docs.midnight.network/develop/reference/midnight-api/dapp-connector

## Core Package

```bash
npm install @midnight-ntwrk/dapp-connector-api
```

This package declares TypeScript interfaces in `src/api.ts` and `src/errors.ts`.

## Provider Injection (Nocturne Wallet)

```typescript
declare global {
  interface Window {
    midnight?: {
      nocturne?: DAppConnectorAPI;
      [walletName: string]: DAppConnectorAPI | undefined;
    };
  }
}

// Inject our wallet provider
function injectProvider(api: DAppConnectorAPI): void {
  if (typeof window.midnight === 'undefined') {
    window.midnight = {};
  }
  window.midnight.nocturne = api;
}

// DApps detect our wallet
function detectNocturne(): DAppConnectorAPI | null {
  return window.midnight?.nocturne ?? null;
}
```

## DAppConnectorAPI Interface (Inferred)

```typescript
interface DAppConnectorAPI {
  isEnabled(): Promise<boolean>;
  enable(): Promise<void>;

  state(): Observable<WalletState>;

  balanceTransaction(tx: UnprovenTransaction, newCoins?: Coin[]): Promise<BalancedTransaction>;
  proveTransaction(tx: BalancedTransaction): Promise<ProvenTransaction>;
  submitTransaction(tx: ProvenTransaction): Promise<TransactionHash>;

  balanceAndProveTransaction(tx: UnprovenTransaction): Promise<ProvenTransaction>;

  serviceUriConfig(): Promise<ServiceUriConfig>;
}

interface ServiceUriConfig {
  indexer: string;
  node: string;
  proofServer: string;
}

interface WalletState {
  address?: string;
  shieldAddress?: string;
  coinPublicKey?: string;
  encryptionPublicKey?: string;
  apiVersion?: string;
}
```

## Connection Flow (DApp perspective)

1. **Detect wallet**: Check `window.midnight.nocturne` exists
2. **Check enabled**: Call `isEnabled()` to see if DApp already authorized
3. **Request enable**: Call `enable()` to trigger wallet popup for authorization
4. **Subscribe state**: Use `state()` observable for wallet state updates
5. **Get URIs**: Call `serviceUriConfig()` for indexer/node/prover endpoints

```typescript
async function connectToNocturne(): Promise<DAppConnectorAPI> {
  const wallet = window.midnight?.nocturne;
  if (!wallet) throw new Error('Nocturne wallet not installed');

  const enabled = await wallet.isEnabled();
  if (!enabled) {
    await wallet.enable(); // Opens popup for user approval
  }

  return wallet;
}
```

## Transaction Flow

```typescript
async function sendTransaction(
  wallet: DAppConnectorAPI,
  tx: UnprovenTransaction
): Promise<string> {
  const proven = await wallet.balanceAndProveTransaction(tx);
  const hash = await wallet.submitTransaction(proven);
  return hash;
}
```

## Sources

- [@midnight-ntwrk/dapp-connector-api](https://www.npmjs.com/package/@midnight-ntwrk/dapp-connector-api)
- [@midnight-ntwrk/wallet](https://www.npmjs.com/package/@midnight-ntwrk/wallet)
- [Midnight DApp Connector Docs](https://docs.midnight.network/develop/reference/midnight-api/dapp-connector)
- [@uppzen/midnight-auth](https://docs.uppzen.com/midnight-auth/docs/api-reference)
- [MeshJS Midnight](https://github.com/MeshJS/midnight)
