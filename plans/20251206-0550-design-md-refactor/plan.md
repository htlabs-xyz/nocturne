# Design.md Refactor Plan

**Date**: 2024-12-06
**Status**: Draft - Awaiting Approval

## Objective

Refactor codebase to fully align with Design.md architecture:
- Variant/VariantBuilder pattern across all wallets
- Service/Capability separation
- Runtime integration
- Facade polymorphic dispatch

## Current State

| Component | Alignment | Action |
|-----------|----------|--------|
| shielded-wallet | 95% | Minor cleanup |
| dust-wallet | 90% | Minor cleanup |
| unshielded-wallet | 10% | **Full refactor** |
| facade | 60% | Runtime integration |

## Phases

### Phase 1: Unshielded Wallet Refactor (Critical)
**Status**: Pending
**Files**: 8 files to modify/create

Implement Variant/VariantBuilder pattern for unshielded-wallet.
- [Phase 1 Details](./phase-01-unshielded-wallet.md)

### Phase 2: Service/Capability Extraction
**Status**: Pending
**Files**: 5 files to create

Extract proper Service/Capability interfaces.
- [Phase 2 Details](./phase-02-services-capabilities.md)

### Phase 3: Facade Runtime Integration
**Status**: Pending
**Files**: 3 files to modify

Integrate Facade with Runtime dispatch.
- [Phase 3 Details](./phase-03-facade-integration.md)

### Phase 4: Code Consolidation
**Status**: Pending
**Files**: 6 files to modify

Reduce duplication, improve maintainability.
- [Phase 4 Details](./phase-04-consolidation.md)

### Phase 5: Testing & Documentation
**Status**: Pending
**Files**: Tests + docs

Verify refactoring, update documentation.
- [Phase 5 Details](./phase-05-testing-docs.md)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking public API | High | Preserve interface contracts |
| Test failures | Medium | Run tests after each phase |
| Runtime incompatibility | High | Follow shielded-wallet pattern exactly |

## Success Criteria

- [ ] All wallets implement Variant interface
- [ ] All wallets implement VariantBuilder interface
- [ ] Facade uses Runtime dispatch
- [ ] All tests pass
- [ ] No public API breaks
