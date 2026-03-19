# Privacy Policy — Nocturne Wallet

**Last updated:** February 26, 2026

---

## Overview

Nocturne Wallet ("the Extension") is a self-custodial browser extension wallet for the Midnight Network. Your privacy and security are fundamental to our design. This policy explains what data the Extension handles and how it is stored.

---

## Data We Do NOT Collect

Nocturne Wallet does **not** collect, transmit, or store on external servers any of the following:

- Personal identification information (name, email, address, age)
- Health information
- Financial information or credit history
- Personal communications
- Location data or IP addresses
- Browsing history
- User activity (clicks, scrolls, keystrokes)
- Web page content

**We have no analytics, telemetry, or tracking of any kind.**

---

## Data Stored Locally on Your Device

All wallet data is stored **exclusively on your device** using Chrome's local storage APIs. Nothing is sent to our servers.

### Encrypted Wallet Data
- Recovery phrase (24-word mnemonic) — encrypted with your password
- Private keys — encrypted with your password
- Account information (names, derived addresses)

### Session Data
- Unlock state and session timestamp — stored in `chrome.storage.session` (cleared when browser closes)
- Wallet addresses for the active session

### User Settings
- Selected network (Preview, Testnet, Devnet, Pre-prod, or custom)
- Network endpoint URLs (RPC node, indexer, prover)
- Address book contacts (names and blockchain addresses)
- Auto-lock timeout preference

---

## Network Communications

The Extension communicates **only** with Midnight Network infrastructure:

| Connection | Purpose |
|---|---|
| **RPC Node** | Submit transactions and query blockchain state |
| **Indexer** | Sync wallet balances and transaction history |
| **Indexer WebSocket** | Real-time balance updates |
| **Prover** | Assist in zero-knowledge proof generation |

These endpoints are determined by the network you select (or custom URLs you provide). **No user data, credentials, or private keys are ever transmitted.**

---

## Permissions Explained

| Permission | Why It's Needed |
|---|---|
| `storage` | Store encrypted wallet data and settings locally on your device |
| `activeTab` | Respond when you click the extension icon |
| `alarms` | Auto-lock the wallet after inactivity (default: 15 minutes) |
| `host_permissions` | Connect to Midnight Network nodes (RPC, indexer, prover) across configurable endpoints |

---

## WebAssembly (WASM)

The Extension uses WebAssembly bundled within the extension package to generate zero-knowledge proofs locally on your device. No remote code is loaded or executed.

---

## Third-Party Data Sharing

We do **not**:
- Sell or transfer user data to third parties
- Use data for advertising or profiling
- Use data for creditworthiness determination or lending purposes
- Share data with analytics or tracking services

---

## Security Measures

- All sensitive data (recovery phrase, private keys) is encrypted before storage
- The wallet auto-locks after a configurable period of inactivity
- Session data is cleared when the browser closes
- Internal messaging validates sender identity to prevent unauthorized access
- The Extension only communicates with blockchain infrastructure — no other external services

---

## Your Control

You have full control over your data:

- **View** your recovery phrase and private keys (requires password)
- **Export** your wallet data at any time
- **Delete** all data via Factory Reset in Settings
- **Choose** which network endpoints to connect to

---

## Changes to This Policy

We may update this policy to reflect changes in the Extension. Updates will be noted with a revised "Last updated" date.

---

## Contact

- **Website**: [nocturne.cash](https://nocturne.cash)
- **GitHub**: [github.com/htlabs/nocturne](https://github.com/htlabs/nocturne)
