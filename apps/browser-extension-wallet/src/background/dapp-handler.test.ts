import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DAppHandler } from './dapp-handler';
import { WalletManager } from './wallet';
import { clearMockStorage } from '@/test/setup';

vi.mock('@midnight-ntwrk/wallet-sdk-hd', () => ({
  generateMnemonicWords: vi.fn(() => [
    'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon',
    'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon',
    'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon',
    'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about',
  ]),
  validateMnemonic: vi.fn((seed: string) => seed.split(' ').length === 24),
  joinMnemonicWords: vi.fn((words: string[]) => words.join(' ')),
  HDWallet: {
    fromSeed: vi.fn(() => ({
      type: 'seedOk',
      hdWallet: {
        selectAccount: vi.fn(() => ({
          selectRole: vi.fn(() => ({
            deriveKeyAt: vi.fn(() => ({
              type: 'keyDerived',
              key: new Uint8Array(32).fill(1),
            })),
          })),
        })),
      },
    })),
  },
  Roles: { Zswap: 0 },
}));

vi.mock('@midnight-ntwrk/wallet-sdk-address-format', () => ({
  ShieldedAddress: class MockShieldedAddress {
    static codec = {
      encode: vi.fn(() => ({ asString: () => 'testnet-02_shield_mock_address' })),
    };
  },
  ShieldedCoinPublicKey: class MockShieldedCoinPublicKey {
    constructor(_buf: Uint8Array) {}
  },
  ShieldedEncryptionPublicKey: class MockShieldedEncryptionPublicKey {
    constructor(_buf: Uint8Array) {}
  },
}));

vi.mock('@midnight-ntwrk/zswap', () => ({
  SecretKeys: {
    fromSeed: vi.fn(() => ({
      coinPublicKey: '0'.repeat(64),
      encryptionPublicKey: '0'.repeat(64),
      coinSecretKey: '0'.repeat(64),
      encryptionSecretKey: '0'.repeat(64),
    })),
  },
}));

vi.mock('@scure/bip39', () => ({
  mnemonicToSeed: vi.fn(() => Promise.resolve(new Uint8Array(64).fill(0))),
}));

describe('DAppHandler', () => {
  let handler: DAppHandler;
  let wallet: WalletManager;
  const testOrigin = 'https://example.com';

  beforeEach(() => {
    clearMockStorage();
    vi.clearAllMocks();
    wallet = new WalletManager();
    handler = new DAppHandler(wallet);
  });

  describe('isEnabled', () => {
    it('should return false for unconnected site', async () => {
      const result = await handler.handleRequest('isEnabled', undefined, testOrigin);
      expect(result).toBe(false);
    });
  });

  describe('serviceUriConfig', () => {
    it('should return network configuration', async () => {
      const result = await handler.handleRequest('serviceUriConfig', undefined, testOrigin);

      expect(result).toHaveProperty('indexerUri');
      expect(result).toHaveProperty('indexerWsUri');
      expect(result).toHaveProperty('proverServerUri');
      expect(result).toHaveProperty('substrateNodeUri');
    });
  });

  describe('state', () => {
    it('should throw error if site not connected', async () => {
      await expect(
        handler.handleRequest('state', undefined, testOrigin),
      ).rejects.toThrow('Site not connected');
    });
  });

  describe('pending request management', () => {
    it('should return undefined for non-existent request', () => {
      const request = handler.getPendingRequest('non-existent-id');
      expect(request).toBeUndefined();
    });

    it('should handle popup close gracefully for non-existent request', () => {
      expect(() => handler.handlePopupClose('non-existent-id')).not.toThrow();
    });
  });

  describe('unknown method', () => {
    it('should throw error for unknown method', async () => {
      await expect(
        handler.handleRequest('unknownMethod', undefined, testOrigin),
      ).rejects.toThrow('Unknown method: unknownMethod');
    });
  });

  describe('connection approval', () => {
    it('should reject connection for non-existent request', async () => {
      await expect(
        handler.approveConnection('non-existent-id', testOrigin),
      ).rejects.toThrow('Request not found');
    });

    it('should handle reject for non-existent request gracefully', async () => {
      await expect(handler.rejectConnection('non-existent-id')).resolves.toBeUndefined();
    });
  });

  describe('transaction approval', () => {
    it('should reject transaction approval for non-existent request', async () => {
      await expect(
        handler.approveTransaction('non-existent-id'),
      ).rejects.toThrow('Request not found');
    });

    it('should handle reject transaction for non-existent request gracefully', async () => {
      await expect(handler.rejectTransaction('non-existent-id')).resolves.toBeUndefined();
    });
  });

  describe('balanceTransaction', () => {
    it('should throw error if site not connected', async () => {
      await expect(
        handler.handleRequest('balanceTransaction', { tx: {} }, testOrigin),
      ).rejects.toThrow('Site not connected');
    });
  });

  describe('proveTransaction', () => {
    it('should throw error if site not connected', async () => {
      await expect(
        handler.handleRequest('proveTransaction', { tx: {} }, testOrigin),
      ).rejects.toThrow('Site not connected');
    });
  });

  describe('submitTransaction', () => {
    it('should throw error if site not connected', async () => {
      await expect(
        handler.handleRequest('submitTransaction', { tx: {} }, testOrigin),
      ).rejects.toThrow('Site not connected');
    });
  });
});
