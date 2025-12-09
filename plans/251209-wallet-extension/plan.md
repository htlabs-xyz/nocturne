# Midnight Wallet Browser Extension - Implementation Plan

**Date**: 2025-12-09 | **Package**: `apps/browser-extension-wallet` | **Platform**: Chrome MV3

## Overview

Browser extension wallet integrating Midnight Wallet SDK (`@midnight-ntwrk/wallet-sdk-facade`) with Shielded, Unshielded, and Dust token support. Phantom-inspired dark UI.

## Goals

1. Full wallet functionality (send/receive all token types)
2. EIP-6963 style provider injection for DApp connectivity
3. Secure key management with Web Crypto API encryption
4. Production-ready with tests and security hardening

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Extension (MV3)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌───────────────┐    ┌─────────────────┐   │
│  │   Popup     │◄──►│ Service Worker │◄──►│ Content Script  │   │
│  │  (React)    │    │  (Background)  │    │   (Provider)    │   │
│  └─────────────┘    └───────────────┘    └─────────────────┘   │
│        │                   │                      │             │
│        │                   ▼                      │             │
│        │          ┌───────────────┐               │             │
│        │          │ WalletFacade  │               │             │
│        │          │  ├─ Shielded  │               │             │
│        │          │  ├─ Unshielded│               │             │
│        │          │  └─ Dust      │               │             │
│        │          └───────────────┘               │             │
│        │                   │                      │             │
│        ▼                   ▼                      ▼             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  chrome.storage.session (keys) | chrome.storage.local (data)││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Server Configuration (from .env.example)

```
INDEXER_HTTP_URL=https://indexer.testnet-02.midnight.network/api/v1/graphql
INDEXER_WS_URL=wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws
PROOF_SERVER_URL=https://lace-dev.proof-pub.stg.midnight.tools
NODE_URL=https://rpc.testnet-02.midnight.network
```

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Build | Webpack 5.97 | Manual config, WASM support |
| UI | React 19.0 + TypeScript 5.9 | Latest stable |
| State | Zustand 5.0 | Cross-context sync |
| Styling | Tailwind CSS 4.0 | Dark theme |
| SDK | @midnight-ntwrk/wallet-sdk-facade | Existing package |
| Testing | Vitest 3.2 + Playwright | Monorepo standard |

## Phases (Diagram → UI → Core)

| # | Phase | Status | Document |
|---|-------|--------|----------|
| 1 | Project Setup | ✅ completed | [phase-01-project-setup.md](./phase-01-project-setup.md) |
| 2 | UI Components | pending | [phase-02-ui-components.md](./phase-02-ui-components.md) |
| 3 | Background Service | pending | [phase-03-background-service.md](./phase-03-background-service.md) |
| 4 | DApp Connector | pending | [phase-04-dapp-connector.md](./phase-04-dapp-connector.md) |
| 5 | Testing & Polish | pending | [phase-05-testing.md](./phase-05-testing.md) |

## Dependencies

```
@midnight-ntwrk/wallet-sdk-facade → shielded, unshielded, dust
@midnight-ntwrk/wallet-sdk-hd → key derivation (BIP44 m/44'/2400'/...)
@midnight-ntwrk/wallet-sdk-address-format → Bech32m formatting
```

## Success Criteria

- [ ] Create/import wallet via seed phrase
- [ ] View balances (Shielded, Unshielded, Dust)
- [ ] Send/receive tokens
- [ ] Connect to DApps, approve transactions
- [ ] Pass security audit checklist
- [ ] E2E tests for critical flows

## Risks

| Risk | Mitigation |
|------|------------|
| Service worker termination | State in chrome.storage.session, reconnection logic |
| SDK bundle size (~100KB gzip) | Tree-shake, lazy load |
| WASM loading in extension | Configure webpack for WASM |

## Code Review Status

**Last Review**: 2025-12-09
**Reviewer**: Code Review Agent
**Report**: [code-reviewer-251209-browser-extension-initial.md](./reports/code-reviewer-251209-browser-extension-initial.md)

**Summary**: ✅ Phase 1 COMPLETED - Build passing, TypeScript strict, MV3 compliant, no critical issues.

**Action Items Before Phase 2**:
1. Add message validation in content script (security)
2. Add error handling in background service worker
3. Remove/wrap console.logs for production
4. Add React error boundary to popup
5. Fix root null check in popup entry
