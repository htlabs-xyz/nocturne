# Phase 2: Service/Capability Extraction

**Date**: 2024-12-06
**Priority**: High
**Status**: Pending

## Context

- [Design.md](../../docs/Design.md) - Service/Capability patterns
- [Sync.ts (shielded)](../../packages/shielded-wallet/src/v1/Sync.ts) - Reference
- [Transacting.ts (shielded)](../../packages/shielded-wallet/src/v1/Transacting.ts) - Reference

## Overview

Extract proper Service/Capability interfaces for unshielded-wallet, following Design.md patterns.

## Key Insights

1. **Service** = async/side-effecting operations
2. **Capability** = pure functional state transformations
3. Capabilities take state + params, return new state or Either
4. Services can depend on external systems

## Requirements

### Service Pattern
```typescript
interface SyncService<TState, TStartAux, TUpdate> {
  startSync(state: TState, aux: TStartAux): Effect<Stream<TUpdate>>;
}
```

### Capability Pattern
```typescript
interface SyncCapability<TState, TUpdate> {
  applyUpdate(state: TState, update: TUpdate): TState;
}
```

## Architecture

```
Services (async, side-effects):
├── SyncService - stream updates from indexer
├── SubmissionService - submit transactions
└── TransactionHistoryService - query history

Capabilities (pure, stateless):
├── SyncCapability - apply sync updates
├── TransactingCapability - create transactions
├── KeysCapability - key derivation
├── CoinsAndBalancesCapability - balance calculations
└── SerializationCapability - state serialization
```

## Related Code Files

| File | Action |
|------|--------|
| `packages/unshielded-wallet/src/v1/Sync.ts` | Create |
| `packages/unshielded-wallet/src/v1/Transacting.ts` | Create |
| `packages/unshielded-wallet/src/v1/Keys.ts` | Create |
| `packages/unshielded-wallet/src/v1/CoinsAndBalances.ts` | Create |
| `packages/unshielded-wallet/src/v1/Serialization.ts` | Create |

## Implementation Steps

### Step 2.1: Create Sync.ts
```typescript
export interface SyncService<TState> {
  startSync(state: TState): Effect<Stream<UnshieldedUpdate>>;
}

export interface SyncCapability<TState> {
  applyUpdate(state: TState, update: UnshieldedUpdate): TState;
}

export const makeDefaultSyncService = (): SyncService<CoreWallet> => ({...});
export const makeDefaultSyncCapability = (): SyncCapability<CoreWallet> => ({...});
```

### Step 2.2: Create Transacting.ts
```typescript
export interface TransactingCapability<TState, TTransaction> {
  createTransfer(state: TState, params: TransferParams): Either<TState, TransferError>;
  finalizeTransaction(state: TState, tx: TTransaction): TState;
}

export const makeDefaultTransactingCapability = (): TransactingCapability<CoreWallet, UnshieldedTx> => ({...});
```

### Step 2.3: Create Keys.ts
```typescript
export interface KeysCapability<TState> {
  deriveAddress(state: TState, index: number): Address;
  getPublicKey(state: TState): PublicKey;
}

export const makeDefaultKeysCapability = (): KeysCapability<CoreWallet> => ({...});
```

### Step 2.4: Create CoinsAndBalances.ts
```typescript
export interface CoinsAndBalancesCapability<TState> {
  getBalance(state: TState): Balance;
  getAvailableCoins(state: TState): Coin[];
  getPendingBalance(state: TState): Balance;
}

export const makeDefaultCoinsAndBalancesCapability = (): CoinsAndBalancesCapability<CoreWallet> => ({...});
```

### Step 2.5: Create Serialization.ts
```typescript
export interface SerializationCapability<TState, TSerialized> {
  serialize(state: TState): TSerialized;
  deserialize(serialized: TSerialized): Either<TState, DeserializationError>;
}

export const makeDefaultSerializationCapability = (): SerializationCapability<CoreWallet, SerializedState> => ({...});
```

## Todo List

- [ ] Create Sync.ts with service + capability
- [ ] Create Transacting.ts with capability
- [ ] Create Keys.ts with capability
- [ ] Create CoinsAndBalances.ts with capability
- [ ] Create Serialization.ts with capability
- [ ] Integrate with V1Builder
- [ ] Run type checking

## Success Criteria

- [ ] All interfaces follow Design.md patterns
- [ ] Services are async/Effect-based
- [ ] Capabilities are pure functions
- [ ] Factory functions provided for each
- [ ] Type checking passes
