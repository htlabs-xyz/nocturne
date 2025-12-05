# Phase 4: Code Consolidation

**Date**: 2024-12-06
**Priority**: Low
**Status**: Pending

## Context

- Large builder files (300-400 lines)
- Duplicated patterns across wallets
- Opportunity for shared utilities

## Overview

Reduce code duplication and improve maintainability by extracting common patterns.

## Key Insights

1. V1Builder files are 300-400 lines
2. Similar capability patterns across wallets
3. Common state management utilities needed
4. Builder pattern could be simplified

## Related Code Files

| File | Action |
|------|--------|
| `packages/shielded-wallet/src/v1/V1Builder.ts` | Refactor |
| `packages/dust-wallet/src/V1Builder.ts` | Refactor |
| `packages/unshielded-wallet/src/v1/V1Builder.ts` | Refactor |
| `packages/utilities/src/builder/index.ts` | Create |
| `packages/utilities/src/state/index.ts` | Create |
| `packages/utilities/src/capability/index.ts` | Create |

## Implementation Steps

### Step 4.1: Extract common builder utilities
```typescript
export function createBuilderFactory<TConfig, TVariant>(): BuilderFactory<TConfig, TVariant>;
export function withComponent<TBuilder, TComponent>(builder: TBuilder, component: TComponent): TBuilder;
```

### Step 4.2: Extract common state utilities
```typescript
export function createStateRef<TState>(initial: TState): SubscriptionRef<TState>;
export function updateStateRef<TState>(ref: SubscriptionRef<TState>, update: (s: TState) => TState): Effect<void>;
```

### Step 4.3: Extract capability base patterns
```typescript
export interface BaseCapability<TState> {...}
export function makeCapabilityFactory<TState, TCapability>(): CapabilityFactory<TState, TCapability>;
```

### Step 4.4: Refactor builders to use utilities
- Reduce V1Builder sizes to ~150 lines
- Use shared utilities
- Maintain type safety

## Todo List

- [ ] Identify common patterns
- [ ] Create builder utilities
- [ ] Create state utilities
- [ ] Create capability utilities
- [ ] Refactor shielded V1Builder
- [ ] Refactor dust V1Builder
- [ ] Refactor unshielded V1Builder
- [ ] Update imports

## Success Criteria

- [ ] Builder files < 200 lines each
- [ ] Common utilities extracted
- [ ] No duplicate code
- [ ] All tests pass
