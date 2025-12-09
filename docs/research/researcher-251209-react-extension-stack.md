# React + TypeScript Chrome Extension Stack Research (2025)

## Executive Summary

For Midnight Wallet's browser extension development, **WXT** is the recommended build framework, paired with **Zustand** for state management, **Tailwind CSS** for styling, and **Vitest + Playwright** for testing. Effect library integrates naturally for background workers and service logic.

---

## 1. Build Tools Comparison

### WXT (Recommended)

**Status**: Active development, production-ready

**Pros**:
- Vite-based (fast dev server, modern HMR)
- Cross-browser support (Chrome, Firefox, Edge, Safari) from single codebase
- MV2 & MV3 support simultaneously
- File-based entrypoint system (automatic manifest generation)
- Active community & maintenance
- Smaller bundle size (400 KB vs Plasmo's 700 KB in real migrations)
- Framework-agnostic (React, Vue, Svelte, Solid)

**Cons**:
- Steeper learning curve than Plasmo for opinionated workflows

### Plasmo (Not Recommended)

**Status**: Maintenance concerns, Parcel bundler outdated

**Pros**:
- Excellent React/TypeScript DX initially
- Next.js-like file routing
- Built-in storage/messaging APIs

**Cons**:
- Uses aging Parcel bundler (causes dependency conflicts)
- Unmaintained (author not actively developing)
- Larger bundle sizes
- React-locked ecosystem

### CRXJS (Not Recommended)

**Status**: Beta/maintenance mode

**Pros**:
- Minimal Vite plugin approach
- Manifest.json as source of truth
- Zero-config setup

**Cons**:
- Main branch obsolete for years
- Requires beta MV3 targeting Vite 3
- Limited feature development
- Less community adoption

### Vite + Manual Config (Not Recommended)

**Pros**:
- Maximum control

**Cons**:
- Manifest bundling complexity
- Content script isolation issues
- Service worker livereload bugs
- High maintenance burden

---

## 2. State Management

### Zustand (Recommended)

**Why**: Best balance for extensions

**Pros**:
- 3 KB bundle size
- Hook-based API (matches React patterns)
- No Provider boilerplate required
- Minimal setup for extension message passing
- Excellent TypeScript support
- Persistent storage integration straightforward

**Cons**:
- Less structured than Redux (teams need discipline)
- No built-in time-travel debugging

**Extension Pattern**:
```ts
create((set) => ({
  walletState: null,
  updateWallet: (state) => set({ walletState: state }),
}))
```
Perfect for content script ↔ background worker sync.

### Jotai (Good Alternative)

**Pros**:
- Atom-based (fine-grained reactivity)
- Superior performance for massive state trees
- Composition model

**Cons**:
- Overkill for most extensions
- Higher learning curve

### Redux Toolkit (Not Recommended)

**Cons**:
- Boilerplate overhead for extension complexity
- Middleware complexity not needed
- Bundle size overhead for extension constraints

---

## 3. Styling Solutions

### Tailwind CSS (Recommended)

**Why**: Fastest iteration, extension-friendly

**Pros**:
- Utility-first (quick prototyping)
- Small PurgeCSS footprint (only used classes bundled)
- Excellent responsive design
- No runtime overhead
- Works in shadow DOM with isolation strategies

**Cons**:
- Class clutter in JSX
- Limited theming flexibility

### CSS Modules (Good Alternative)

**When to use**: If extensive theming needed

**Pros**:
- Local scoping (prevents conflicts in complex extensions)
- Familiar CSS syntax
- Build-time optimization

**Cons**:
- More build setup
- Dynamic styling requires workarounds

### Styled-Components (Not Recommended)

**Cons**:
- Runtime CSS-in-JS penalty (extension bundle bloat)
- Shadow DOM incompatibility
- Unnecessary for extension constraints

---

## 4. Effect Library Integration

### Recommended Pattern

Effect fits naturally into **background service workers** and **async flows**:

```ts
// Background worker
import * as Effect from "effect"

export const syncWallet: Effect.Effect<void, WalletError> = Effect.gen(function*() {
  const wallet = yield* getWalletState()
  const validated = yield* validateWalletAddress(wallet.address)
  yield* persistToStorage(validated)
})

Effect.runPromise(syncWallet) // Invoked on wallet updates
```

### Integration Points

1. **Background Service Worker**: Handle async wallet operations, indexer sync
2. **Content Script Messaging**: Type-safe message passing between contexts
3. **Storage Abstraction**: Wrap extension storage API with Effect for error handling
4. **Wallet Validation**: Leverage Effect's error accumulation for multi-field validation

### Why Effect Works Here

- **Resource Management**: Cleanup listeners/subscriptions automatically
- **Error Composition**: Combines validation errors elegantly
- **Functional Purity**: Background logic stays deterministic (testable)
- **Matches SDK Architecture**: Wallet SDK already uses Effect (no dependency duplication)

### Bundle Consideration

Effect ~100 KB (gzip ~30 KB). For extensions:
- Only use in background worker (not content scripts)
- Tree-shake unused modules
- Share between wallet SDK and extension

---

## 5. Testing Strategy

### Unit Testing: Vitest (Recommended)

**Setup**:
```
npm install -D vitest @vitest/ui vitest-browser-react
```

**Why**:
- Vite-native (matches dev pipeline)
- Browser mode with Playwright (real DOM, not JSDOM simulation)
- Parallel execution
- Native TS/JSX support

**Extension-Specific Tests**:
```ts
// vitest.config.ts
export default defineConfig({
  test: {
    browser: {
      provider: 'playwright',
      enabled: true,
    },
    globals: true,
  },
})

// Test background worker with Effect
describe('WalletSync', () => {
  it('validates address before sync', async () => {
    const result = await Effect.runPromise(syncWallet)
    expect(result).toBeDefined()
  })
})
```

### Integration Testing: Playwright

**Use for**:
- Content script injection
- Message passing (popup ↔ background ↔ content)
- Storage operations
- Extension manifest compliance

```ts
test('popup updates when background syncs', async ({ page }) => {
  await page.evaluate(() => {
    chrome.runtime.sendMessage({ action: 'sync' })
  })
  await expect(page.locator('[data-testid="balance"]')).toContainText('$')
})
```

### E2E Testing: Playwright Test

**Coverage**:
- Extension install/enable workflow
- Wallet creation flow
- Transaction signing (mock)

---

## 6. Hot Reload Development Setup

### WXT Built-In

WXT provides HMR out-of-the-box:
- React component changes: instant HMR
- Manifest changes: extension auto-reload
- Background worker: service worker refresh

**Setup** (minimal):
```ts
// wxt.config.ts
export default defineConfig({
  dev: {
    autoReload: true,
  },
})
```

### Content Script Hot Reload

Challenge: Content scripts can't unload mid-session.

**Solution**:
```ts
// Watch for manifest version changes
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'EXTENSION_RELOADED') {
    window.location.reload() // Reload page with new script
  }
})
```

### Local Storage Persistence

WXT + Zustand combo:
```ts
create((set) => ({
  wallet: null,
  hydrate: async () => {
    const stored = await chrome.storage.local.get('wallet')
    set({ wallet: stored.wallet })
  },
}), {
  name: 'wallet-store',
  storage: createJSONStorage(() => chrome.storage.local),
})
```

Persists across reloads automatically.

---

## 7. Recommended Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Build** | WXT | Active, Vite-based, MV3-ready |
| **React** | React 18+ | Current standard |
| **State** | Zustand | Minimal overhead, extension-friendly |
| **Styling** | Tailwind CSS | Fast iteration, small footprint |
| **Effect** | Background worker | Functional async, error handling |
| **Testing** | Vitest + Playwright | Real browser, parallel execution |
| **Package Manager** | Yarn (existing) | Monorepo support (SDK included) |

---

## 8. Implementation Checklist

- [ ] Initialize WXT project with React template
- [ ] Configure Zustand for wallet state (cross-context message passing)
- [ ] Set up Tailwind CSS with shadow DOM strategies
- [ ] Create Effect-based background worker for wallet sync
- [ ] Configure Vitest with Playwright browser mode
- [ ] Add Playwright E2E tests for key flows
- [ ] Implement message passing types between popup/content/background
- [ ] Set up extension signing/submission workflow
- [ ] Document storage schema (chrome.storage.local)
- [ ] Add Sentry/error tracking for production

---

## Unresolved Questions

1. **Effect bundle inclusion**: Should wallet SDK expose Effect-free wrapper API for extensions, or accept 30 KB gzip overhead?
2. **Manifest V3 timeline**: Are we targeting MV3 only, or maintaining MV2 fallback for older Chrome versions?
3. **Cross-extension communication**: Will wallet extension need to communicate with other extensions (DEX aggregators, etc.)?
4. **Permission scope**: What security model for content script injection (all sites vs. allowlist)?

---

## Sources

- [The 2025 State of Browser Extension Frameworks: Plasmo, WXT, CRXJS](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [State Management in 2025: Context, Redux, Zustand, Jotai](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [Building Chrome Extension with Vite, React, Tailwind](https://www.artmann.co/articles/building-a-chrome-extension-with-vite-react-and-tailwind-css-in-2025)
- [React Component Testing with Vitest Browser Mode](https://akoskm.com/react-component-testing-with-vitests-browser-mode-and-playwright/)
- [Effect Documentation](https://effect.website/)
- [WXT Framework Documentation](https://wxt.dev/)
