# Wallet Extension Tech Stack

## Overview

Browser extension for Midnight Wallet SDK - Chrome only (Manifest V3).

## Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Build | Webpack 5 | ^5.90 | Bundling, code splitting |
| UI | React | ^18.3 | Component framework |
| Language | TypeScript | ^5.9 | Type safety |
| State | Zustand | ^4.5 | Global state management |
| Styling | Tailwind CSS | ^3.4 | Utility-first CSS |
| SDK | Effect | (SDK version) | Functional programming |
| Testing | Vitest | ^3.2 | Unit testing |
| E2E | Playwright | ^1.48 | Browser automation |
| Package | Yarn | ^4.10 | Monorepo workspaces |

## Architecture

```
packages/extension/
├── src/
│   ├── popup/              # React UI
│   │   ├── pages/          # Route pages
│   │   ├── components/     # Reusable UI
│   │   ├── hooks/          # Custom hooks
│   │   └── stores/         # Zustand stores
│   ├── background/         # Service worker
│   │   ├── wallet.ts       # WalletFacade integration
│   │   ├── messaging.ts    # Message handlers
│   │   └── storage.ts      # Encrypted storage
│   ├── content/            # Content scripts
│   │   └── provider.ts     # DApp injection
│   └── shared/             # Shared code
│       ├── types/          # TypeScript types
│       └── utils/          # Utilities
├── public/
│   └── icons/              # Extension icons
├── manifest.json           # Chrome MV3 manifest
├── webpack.config.ts       # Webpack configuration
├── tailwind.config.js      # Tailwind config
└── tsconfig.json           # TypeScript config
```

## Key Dependencies

### Production
- `@midnight-ntwrk/wallet-sdk-facade` - Wallet SDK facade
- `react`, `react-dom` - UI framework
- `zustand` - State management
- `rxjs` - Observable patterns (SDK compatibility)
- `webextension-polyfill` - Browser API polyfill

### Development
- `webpack`, `webpack-cli`, `webpack-dev-server`
- `ts-loader`, `css-loader`, `postcss-loader`
- `tailwindcss`, `autoprefixer`
- `@types/chrome`, `@types/react`
- `vitest`, `@playwright/test`

## Browser Support

- Chrome 116+ (Manifest V3)
- Chromium-based browsers (Edge, Brave, Opera)

## Security Considerations

1. Private keys encrypted with Web Crypto API
2. Session storage for sensitive data (clears on close)
3. Content script isolation (no key exposure)
4. CSP enforcement in manifest
5. Input validation on all RPC methods
