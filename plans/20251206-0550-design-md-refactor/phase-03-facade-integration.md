# Phase 3: Facade Runtime Integration

**Date**: 2024-12-06
**Priority**: Medium
**Status**: Pending

## Context

- [Design.md](../../docs/Design.md) - Facade pattern
- [Runtime.ts](../../packages/runtime/src/Runtime.ts) - Dispatch mechanism
- [facade/src/index.ts](../../packages/facade/src/index.ts) - Current implementation

## Overview

Integrate Facade with Runtime for polymorphic dispatch while preserving public API.

## Key Insights

1. Current facade uses direct delegation
2. Runtime.dispatch() enables version-aware routing
3. Hybrid approach: Runtime internally, same API externally
4. Enables hard-fork migration support

## Requirements

### Runtime Dispatch Pattern
```typescript
runtime.dispatch({
  callV1: (variant) => variant.someOperation(...),
  callV2: (variant) => variant.someOperation(...),
});
```

## Architecture

```
Facade (public API - unchanged)
  └── InternalRuntime
      ├── ShieldedRuntime → ShieldedVariant
      ├── UnshieldedRuntime → UnshieldedVariant
      └── DustRuntime → DustVariant
```

## Related Code Files

| File | Action |
|------|--------|
| `packages/facade/src/index.ts` | Modify |
| `packages/facade/src/internal/RuntimeManager.ts` | Create |
| `packages/facade/src/internal/index.ts` | Create |

## Implementation Steps

### Step 3.1: Create RuntimeManager
```typescript
export class RuntimeManager {
  private shieldedRuntime: Runtime<ShieldedVariants>;
  private unshieldedRuntime: Runtime<UnshieldedVariants>;
  private dustRuntime: Runtime<DustVariants>;

  dispatch<T>(op: WalletOperation<T>): Effect<T> {...}
}
```

### Step 3.2: Modify Facade constructor
- Accept Runtime instances instead of direct wallets
- Use RuntimeManager for dispatch
- Preserve public interface

### Step 3.3: Update transaction routing
- Replace conditional logic with Runtime.dispatch
- Handle version-aware operations
- Maintain error handling

### Step 3.4: Update state management
- Combine Runtime state streams
- Preserve RxJS observable interface
- Handle state change events

## Todo List

- [ ] Create RuntimeManager class
- [ ] Modify Facade constructor
- [ ] Update transaction methods
- [ ] Update state handling
- [ ] Preserve public API
- [ ] Run integration tests

## Success Criteria

- [ ] Facade uses Runtime dispatch internally
- [ ] Public API unchanged
- [ ] All facade tests pass
- [ ] Version-aware dispatch works
