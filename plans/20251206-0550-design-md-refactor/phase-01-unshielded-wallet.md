# Phase 1: Unshielded Wallet Refactor

**Date**: 2024-12-06
**Priority**: Critical
**Status**: Pending

## Context

- [Design.md](../../docs/Design.md) - Architecture specification
- [Variant.ts](../../packages/runtime/src/abstractions/Variant.ts) - Interface to implement
- [V1Builder.ts (shielded)](../../packages/shielded-wallet/src/v1/V1Builder.ts) - Reference implementation

## Overview

Refactor unshielded-wallet to implement Variant/VariantBuilder pattern, matching shielded-wallet architecture.

## Key Insights

1. Current uses Effect Context/Layer instead of composition
2. Must implement `Variant<TTag, TState, TRunning>` interface
3. Must implement `VariantBuilder<TVariant>` interface
4. State must be immutable domain type
5. Public API must be preserved

## Requirements

### Must Implement

```typescript
interface Variant<TTag, TState, TRunning> {
  readonly tag: TTag;
  start(context: VariantContext): Effect<TRunning>;
  migrateState(previousState: unknown): Effect<TState>;
}

interface VariantBuilder<TVariant> {
  build(config: BuilderConfig): TVariant;
}
```

## Architecture

```
UnshieldedWallet (Facade - preserved API)
  └── implements WalletLike
      └── V1Builder (new - implements VariantBuilder)
          └── V1Variant (new - implements Variant)
              └── RunningV1Variant
                  └── CoreWallet (State type)
                      └── SyncService
                      └── TransactionService
                      └── KeysCapability
                      └── CoinsAndBalancesCapability
```

## Related Code Files

| File | Action | Lines |
|------|--------|-------|
| `packages/unshielded-wallet/src/v1/V1Builder.ts` | Create | ~200 |
| `packages/unshielded-wallet/src/v1/V1Variant.ts` | Create | ~80 |
| `packages/unshielded-wallet/src/v1/RunningV1Variant.ts` | Create | ~150 |
| `packages/unshielded-wallet/src/v1/CoreWallet.ts` | Create | ~100 |
| `packages/unshielded-wallet/src/WalletBuilder.ts` | Modify | Wrap new pattern |
| `packages/unshielded-wallet/src/index.ts` | Modify | Export v1 |

## Implementation Steps

### Step 1.1: Create v1 directory structure
```
packages/unshielded-wallet/src/
├── v1/
│   ├── V1Builder.ts
│   ├── V1Variant.ts
│   ├── RunningV1Variant.ts
│   ├── CoreWallet.ts
│   ├── Sync.ts (move/adapt from SyncService)
│   ├── Transacting.ts (move/adapt from TransactionService)
│   └── index.ts
└── (existing files - modify for compatibility)
```

### Step 1.2: Create CoreWallet state type
- Immutable state type
- Helper methods for state transitions
- Compatible with existing UnshieldedStateAPI

### Step 1.3: Create V1Variant
- Implement Variant interface
- Tag: "unshielded-v1"
- start() creates RunningV1Variant
- migrateState() for version transitions

### Step 1.4: Create V1Builder
- Implement VariantBuilder interface
- Configure services/capabilities
- Builder pattern with fluent API

### Step 1.5: Create RunningV1Variant
- Manage state via SubscriptionRef
- Expose state stream
- Coordinate services/capabilities

### Step 1.6: Adapt existing services
- Convert SyncService to Service interface
- Convert TransactionService to Capability
- Preserve existing logic

### Step 1.7: Update WalletBuilder.ts
- Use new V1Builder internally
- Preserve public API

### Step 1.8: Update exports
- Export v1 components
- Maintain backward compatibility

## Todo List

- [ ] Create v1 directory
- [ ] Create CoreWallet.ts
- [ ] Create V1Variant.ts
- [ ] Create V1Builder.ts
- [ ] Create RunningV1Variant.ts
- [ ] Adapt Sync service/capability
- [ ] Adapt Transacting capability
- [ ] Update WalletBuilder.ts
- [ ] Update index.ts exports
- [ ] Run type checking

## Success Criteria

- [ ] V1Variant implements Variant interface
- [ ] V1Builder implements VariantBuilder interface
- [ ] All existing tests pass
- [ ] Type checking passes
- [ ] Public API unchanged

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| API break | Low | High | Keep WalletBuilder facade |
| Logic errors | Medium | High | Port existing code carefully |
| Type mismatches | Medium | Medium | Follow shielded-wallet types |

## Security Considerations

- Key management logic unchanged
- No new external dependencies
- State transitions remain atomic
