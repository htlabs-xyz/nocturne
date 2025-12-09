# Phase 05: Testing & Polish

**Status**: pending | **Priority**: Medium

## Overview

Comprehensive testing and security hardening for production readiness.

## Test Structure

```
packages/extension/
├── src/
│   └── __tests__/
│       ├── unit/
│       │   ├── storage.test.ts
│       │   ├── wallet.test.ts
│       │   └── messageRouter.test.ts
│       ├── components/
│       │   ├── Button.test.tsx
│       │   ├── BalanceCard.test.tsx
│       │   └── TokenList.test.tsx
│       └── e2e/
│           ├── onboarding.spec.ts
│           ├── send.spec.ts
│           └── dapp-connect.spec.ts
└── playwright.config.ts
```

## Unit Tests

### Storage Manager Tests

```typescript
// src/__tests__/unit/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager } from '@/background/storage';

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    storage = new StorageManager();
  });

  describe('encryption', () => {
    it('encrypts and decrypts seed phrase correctly', async () => {
      const seed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const password = 'testPassword123';

      const encrypted = await storage.encryptSeed(seed, password);

      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      const decrypted = await storage.decryptSeed(
        encrypted.encrypted,
        encrypted.salt,
        encrypted.iv,
        password
      );

      expect(decrypted).toBe(seed);
    });

    it('fails with wrong password', async () => {
      const seed = 'test seed phrase';
      const encrypted = await storage.encryptSeed(seed, 'correctPassword');

      await expect(
        storage.decryptSeed(encrypted.encrypted, encrypted.salt, encrypted.iv, 'wrongPassword')
      ).rejects.toThrow();
    });
  });
});
```

### Component Tests

```typescript
// src/__tests__/components/BalanceCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BalanceCard } from '@/popup/pages/Dashboard/BalanceCard';

describe('BalanceCard', () => {
  it('renders total balance', () => {
    render(<BalanceCard totalUsd="$1,500.00" />);
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
  });

  it('hides shielded balance by default', () => {
    render(<BalanceCard shielded={{ hidden: true, amount: '500' }} />);
    expect(screen.getByText('●●●●●')).toBeInTheDocument();
  });

  it('shows unshielded balance', () => {
    render(<BalanceCard unshielded={{ token: 'NIGHT', amount: '1000' }} />);
    expect(screen.getByText('1000 NIGHT')).toBeInTheDocument();
  });
});
```

## E2E Tests

### Playwright Config

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  timeout: 30000,
  use: {
    headless: false,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.resolve('./dist')}`,
            `--load-extension=${path.resolve('./dist')}`,
          ],
        },
      },
    },
  ],
});
```

### Onboarding E2E

```typescript
// src/__tests__/e2e/onboarding.spec.ts
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('Onboarding Flow', () => {
  test('creates new wallet', async () => {
    const extensionPath = path.resolve('./dist');

    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    const [background] = context.serviceWorkers();
    const extensionId = background.url().split('/')[2];

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(page.getByText('Welcome to Nocturne')).toBeVisible();

    await page.click('text=Create Wallet');
    await expect(page.getByText('Your Recovery Phrase')).toBeVisible();

    // Verify seed phrase shown
    const seedWords = await page.locator('.seed-word').count();
    expect(seedWords).toBe(12);

    await page.click('text=Continue');

    // Set password
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!');
    await page.click('text=Create Wallet');

    await expect(page.getByText('Total Balance')).toBeVisible();

    await context.close();
  });
});
```

## Security Checklist

### Key Management
- [ ] Seed phrase never stored in plaintext
- [ ] AES-256-GCM encryption for stored keys
- [ ] PBKDF2 with 100,000 iterations for key derivation
- [ ] Session keys cleared on browser close
- [ ] Private keys never leave service worker

### Input Validation
- [ ] Seed phrase validated before import
- [ ] Address format validated (Bech32m)
- [ ] Amount validated (positive, within balance)
- [ ] Origin validated for DApp requests

### Content Security
- [ ] CSP configured in manifest
- [ ] No inline scripts
- [ ] No eval() usage
- [ ] HTTPS only for external requests

### DApp Security
- [ ] Origin verification for all requests
- [ ] User approval for sensitive operations
- [ ] Transaction details shown before signing
- [ ] Connected sites list manageable

## Performance Checklist

- [ ] Bundle size < 500KB gzip
- [ ] First paint < 200ms
- [ ] Service worker startup < 100ms
- [ ] Lazy load non-critical components
- [ ] Tree-shake unused SDK code

## Todo List

- [ ] Setup Vitest with React Testing Library
- [ ] Write unit tests for StorageManager
- [ ] Write unit tests for WalletManager
- [ ] Write unit tests for MessageRouter
- [ ] Write component tests
- [ ] Setup Playwright for E2E
- [ ] Write onboarding E2E test
- [ ] Write send flow E2E test
- [ ] Write DApp connect E2E test
- [ ] Complete security checklist
- [ ] Performance audit
- [ ] Accessibility audit

## Success Criteria

- [ ] 80%+ code coverage
- [ ] All E2E tests pass
- [ ] Security checklist complete
- [ ] Bundle size < 500KB
- [ ] No accessibility violations

---

## Human-Like Testing with Playwright + Chrome DevTools

### Overview

Manual-style E2E testing simulating real user behavior. Uses Playwright with visible browser + Chrome DevTools skill for debugging and performance analysis.

### Prerequisites

```bash
# Install Playwright with browser
bunx playwright install chromium

# Chrome DevTools skill dependencies
cd .claude/skills/chrome-devtools/scripts
./install-deps.sh
npm install
```

### Test Configuration

```typescript
// playwright-human.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './src/__tests__/e2e-human',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    video: 'on',
    screenshot: 'on',
    trace: 'on',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'extension',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 500,
          args: [
            `--disable-extensions-except=${path.resolve('./dist')}`,
            `--load-extension=${path.resolve('./dist')}`,
            '--auto-open-devtools-for-tabs',
          ],
        },
      },
    },
  ],
});
```

### Human-Like Test Helpers

```typescript
// src/__tests__/e2e-human/helpers/human-actions.ts
import { Page, BrowserContext } from '@playwright/test';

export class HumanLikeActions {
  constructor(private page: Page) {}

  async typeSlowly(selector: string, text: string, delay = 100) {
    const el = this.page.locator(selector);
    await el.click();
    await this.page.waitForTimeout(200);
    for (const char of text) {
      await el.pressSequentially(char, { delay });
      await this.page.waitForTimeout(Math.random() * 50);
    }
  }

  async clickWithDelay(selector: string, waitAfter = 500) {
    await this.page.locator(selector).hover();
    await this.page.waitForTimeout(200);
    await this.page.locator(selector).click();
    await this.page.waitForTimeout(waitAfter);
  }

  async scrollIntoViewAndClick(selector: string) {
    const el = this.page.locator(selector);
    await el.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
    await el.click();
  }

  async waitAndVerify(selector: string, expectedText: string) {
    await this.page.waitForSelector(selector, { state: 'visible' });
    const text = await this.page.locator(selector).textContent();
    return text?.includes(expectedText);
  }
}

export async function getExtensionPage(context: BrowserContext) {
  const [background] = context.serviceWorkers();
  if (!background) throw new Error('Service worker not found');
  const extensionId = background.url().split('/')[2];
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return { page, extensionId };
}
```

### Complete Wallet Flow Test

```typescript
// src/__tests__/e2e-human/wallet-flow.spec.ts
import { test, expect, chromium } from '@playwright/test';
import { HumanLikeActions, getExtensionPage } from './helpers/human-actions';
import path from 'path';

test.describe('Complete Wallet Flow (Human-Like)', () => {
  const extensionPath = path.resolve('./dist');
  const testPassword = 'TestPassword123!';

  test('1. Create new wallet and verify dashboard', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      slowMo: 300,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--auto-open-devtools-for-tabs',
      ],
    });

    const { page, extensionId } = await getExtensionPage(context);
    const human = new HumanLikeActions(page);

    // Step 1: Welcome screen
    await expect(page.getByText('Welcome to Nocturne')).toBeVisible();
    await page.screenshot({ path: './test-results/01-welcome.png' });
    await human.clickWithDelay('button:has-text("Create Wallet")', 800);

    // Step 2: Seed phrase display
    await expect(page.getByText('Your Recovery Phrase')).toBeVisible();
    const seedWords = await page.locator('[data-testid="seed-word"]').allTextContents();
    expect(seedWords.length).toBe(12);
    console.log('Seed phrase captured (for test only):', seedWords.join(' '));
    await page.screenshot({ path: './test-results/02-seed-phrase.png' });

    // Step 3: Confirm seed (select words in order)
    await human.clickWithDelay('button:has-text("Continue")', 500);
    // Verify seed confirmation UI exists
    await expect(page.getByText('Confirm Your Phrase')).toBeVisible();
    // Click words in correct order
    for (let i = 0; i < 4; i++) {
      await human.clickWithDelay(`[data-testid="confirm-word-${i}"]`, 300);
    }
    await page.screenshot({ path: './test-results/03-seed-confirm.png' });

    // Step 4: Set password
    await human.clickWithDelay('button:has-text("Continue")', 500);
    await human.typeSlowly('input[name="password"]', testPassword, 80);
    await human.typeSlowly('input[name="confirmPassword"]', testPassword, 80);
    await page.screenshot({ path: './test-results/04-password.png' });

    await human.clickWithDelay('button:has-text("Create Wallet")', 1000);

    // Step 5: Dashboard verification
    await expect(page.getByText('Total Balance')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="shielded-balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="unshielded-balance"]')).toBeVisible();
    await page.screenshot({ path: './test-results/05-dashboard.png' });

    await context.close();
  });

  test('2. Send tokens flow', async () => {
    const context = await chromium.launchPersistentContext('./test-profile', {
      headless: false,
      slowMo: 300,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    const { page } = await getExtensionPage(context);
    const human = new HumanLikeActions(page);

    // Unlock wallet
    await human.typeSlowly('input[name="password"]', testPassword, 80);
    await human.clickWithDelay('button:has-text("Unlock")', 1000);

    // Navigate to send
    await human.clickWithDelay('[data-testid="send-button"]', 500);
    await expect(page.getByText('Send Tokens')).toBeVisible();

    // Fill send form
    const testAddress = 'midnight1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
    await human.typeSlowly('input[name="recipient"]', testAddress, 50);
    await human.typeSlowly('input[name="amount"]', '10', 100);

    // Select token type
    await human.clickWithDelay('[data-testid="token-select"]', 300);
    await human.clickWithDelay('[data-testid="token-unshielded"]', 500);

    await page.screenshot({ path: './test-results/06-send-form.png' });

    // Verify transaction preview
    await human.clickWithDelay('button:has-text("Continue")', 800);
    await expect(page.getByText('Confirm Transaction')).toBeVisible();
    await expect(page.getByText('10 NIGHT')).toBeVisible();
    await page.screenshot({ path: './test-results/07-send-confirm.png' });

    await context.close();
  });

  test('3. Receive tokens flow', async () => {
    const context = await chromium.launchPersistentContext('./test-profile', {
      headless: false,
      slowMo: 300,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    const { page } = await getExtensionPage(context);
    const human = new HumanLikeActions(page);

    // Unlock
    await human.typeSlowly('input[name="password"]', testPassword, 80);
    await human.clickWithDelay('button:has-text("Unlock")', 1000);

    // Navigate to receive
    await human.clickWithDelay('[data-testid="receive-button"]', 500);
    await expect(page.getByText('Receive Tokens')).toBeVisible();

    // Verify QR code displayed
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible();

    // Copy address
    await human.clickWithDelay('[data-testid="copy-address"]', 500);
    await expect(page.getByText('Copied!')).toBeVisible();

    await page.screenshot({ path: './test-results/08-receive.png' });
    await context.close();
  });

  test('4. DApp connection flow', async () => {
    const context = await chromium.launchPersistentContext('./test-profile', {
      headless: false,
      slowMo: 300,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    // Open test DApp page
    const dappPage = await context.newPage();
    await dappPage.goto('http://localhost:3000/test-dapp');

    // Click connect wallet on DApp
    await dappPage.click('button:has-text("Connect Wallet")');

    // Extension popup opens - get it
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      dappPage.click('button:has-text("Connect Wallet")'),
    ]);

    const human = new HumanLikeActions(popup);

    // Verify connection request
    await expect(popup.getByText('Connection Request')).toBeVisible();
    await expect(popup.getByText('localhost:3000')).toBeVisible();
    await popup.screenshot({ path: './test-results/09-dapp-connect.png' });

    // Approve connection
    await human.clickWithDelay('button:has-text("Connect")', 1000);

    // Verify DApp shows connected
    await expect(dappPage.getByText('Connected')).toBeVisible();

    await context.close();
  });

  test('5. Transaction signing flow', async () => {
    const context = await chromium.launchPersistentContext('./test-profile', {
      headless: false,
      slowMo: 300,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    const dappPage = await context.newPage();
    await dappPage.goto('http://localhost:3000/test-dapp');

    // Trigger transaction from DApp
    await dappPage.click('button:has-text("Send Transaction")');

    // Get approval popup
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      dappPage.click('button:has-text("Send Transaction")'),
    ]);

    const human = new HumanLikeActions(popup);

    // Verify transaction details
    await expect(popup.getByText('Approve Transaction')).toBeVisible();
    await expect(popup.locator('[data-testid="tx-amount"]')).toBeVisible();
    await expect(popup.locator('[data-testid="tx-recipient"]')).toBeVisible();
    await popup.screenshot({ path: './test-results/10-tx-approve.png' });

    // Approve transaction
    await human.clickWithDelay('button:has-text("Approve")', 1000);

    // Verify success on DApp
    await expect(dappPage.getByText('Transaction Sent')).toBeVisible();

    await context.close();
  });
});
```

### Chrome DevTools Performance Analysis

```bash
# Run from .claude/skills/chrome-devtools/scripts/

# Capture extension popup performance
node performance.js \
  --url "chrome-extension://<EXTENSION_ID>/popup.html" \
  --headless false \
  --output ./docs/screenshots/perf-popup.json

# Network analysis during DApp connection
node network.js \
  --url "http://localhost:3000/test-dapp" \
  --duration 10000 \
  --output ./docs/screenshots/network-dapp.json

# Console monitoring for errors
node console.js \
  --url "chrome-extension://<EXTENSION_ID>/popup.html" \
  --types error,warn \
  --duration 30000

# Interactive snapshot for element inspection
node snapshot.js \
  --url "chrome-extension://<EXTENSION_ID>/popup.html" \
  --headless false | jq '.elements'
```

### Manual Testing Checklist

Run each test visually and verify:

#### Onboarding Flow
- [ ] Welcome screen displays correctly
- [ ] Create/Import wallet buttons visible
- [ ] Seed phrase shows 12 words
- [ ] Seed confirmation works
- [ ] Password requirements enforced
- [ ] Dashboard loads after creation

#### Dashboard
- [ ] Total balance displays
- [ ] Shielded balance hidden by default
- [ ] Toggle shielded visibility works
- [ ] Unshielded balance shows
- [ ] Dust balance shows (if any)
- [ ] Send/Receive buttons functional
- [ ] Settings accessible

#### Send Flow
- [ ] Address input validates format
- [ ] Amount validates against balance
- [ ] Token type selector works
- [ ] Transaction preview accurate
- [ ] Confirmation screen shows details
- [ ] Success/error handling works

#### Receive Flow
- [ ] QR code generates correctly
- [ ] Address displays in full
- [ ] Copy button works
- [ ] Shielded/Unshielded address toggle

#### DApp Connector
- [ ] Connection request popup appears
- [ ] Origin correctly displayed
- [ ] Permissions shown clearly
- [ ] Connect/Reject buttons work
- [ ] Connected sites manageable
- [ ] Transaction approval popup works
- [ ] Transaction details readable
- [ ] Approve/Reject buttons work

#### Settings
- [ ] Lock wallet works
- [ ] Change password works
- [ ] Connected sites list accurate
- [ ] Disconnect sites works
- [ ] Export seed phrase (with password)
- [ ] Clear data warning shown

### NPM Scripts

```json
{
  "scripts": {
    "test:e2e:human": "playwright test --config playwright-human.config.ts",
    "test:e2e:human:ui": "playwright test --config playwright-human.config.ts --ui",
    "test:e2e:human:debug": "PWDEBUG=1 playwright test --config playwright-human.config.ts",
    "test:e2e:human:report": "playwright show-report"
  }
}
```

### Human Testing Todo

- [ ] Setup Playwright human config
- [ ] Create human-actions helper module
- [ ] Write wallet creation E2E test
- [ ] Write send flow E2E test
- [ ] Write receive flow E2E test
- [ ] Write DApp connection E2E test
- [ ] Write transaction signing E2E test
- [ ] Run Chrome DevTools performance analysis
- [ ] Complete manual testing checklist
- [ ] Generate video recordings for all flows
- [ ] Capture screenshots at each step
- [ ] Document any bugs found
