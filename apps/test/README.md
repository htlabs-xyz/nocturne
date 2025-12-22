# Midnight Wallet SDK Test App

Test application demonstrating the usage of Shielded, Unshielded, and Dust wallets from the Midnight Wallet SDK.

## Quick Start

```bash
# Install dependencies
bun install

# Run all tests
bun run src/index.ts

# Run individual tests
bun run src/shield.ts    # Shielded wallet (runs in simulator mode)
bun run src/unshield.ts  # Unshielded wallet (requires indexer)
bun run src/dust.ts      # Dust wallet (requires indexer)
```

## Wallet Types

### Shielded Wallet

Privacy-preserving wallet using zero-knowledge proofs. Runs in **simulation mode** without external infrastructure.

Features demonstrated:
- Wallet creation from seed
- Address generation
- Token transfer between wallets
- Balance tracking

### Unshielded Wallet

Standard transparent wallet for Night tokens. Requires **indexer** to be running.

```bash
INDEXER_HTTP_URL=http://localhost:8088/api/v3/graphql \
INDEXER_WS_URL=ws://localhost:8088/api/v3/graphql/ws \
bun run src/unshield.ts
```

### Dust Wallet

Wallet for managing Dust tokens (fee tokens). Requires **indexer, prover, and node** to be running.

```bash
INDEXER_HTTP_URL=http://localhost:8088/api/v3/graphql \
INDEXER_WS_URL=ws://localhost:8088/api/v3/graphql/ws \
PROVING_SERVER_URL=http://localhost:6300 \
RELAY_URL=ws://localhost:9944 \
bun run src/dust.ts
```

## Infrastructure Setup

For unshielded and dust wallet tests, start the infrastructure using docker-compose:

```bash
cd /path/to/midnight-wallet
docker-compose up
```

## Project Structure

```
src/
├── index.ts      # Main test runner combining all wallets
├── shield.ts     # Shielded wallet test (simulator mode)
├── unshield.ts   # Unshielded wallet test
└── dust.ts       # Dust wallet test
```

## HD Wallet Key Derivation

All wallet types use HD (Hierarchical Deterministic) key derivation following BIP-44:

- Path: `m/44'/2400'/{account}'/{role}/{index}`
- Roles:
  - `0` - Night External (unshielded)
  - `1` - Night Internal (unshielded change)
  - `2` - Dust
  - `3` - Zswap (shielded)
  - `4` - Metadata
