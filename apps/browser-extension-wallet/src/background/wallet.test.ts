import { describe, it, expect, beforeEach, vi } from 'vitest';
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
}));

describe('WalletManager', () => {
  let wallet: WalletManager;

  beforeEach(() => {
    wallet = new WalletManager();
    clearMockStorage();
    vi.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a new wallet with seed and address', async () => {
      const password = 'testpassword123';

      const result = await wallet.createWallet(password);

      expect(result.seed).toBeDefined();
      expect(result.seed.split(' ').length).toBe(24);
      expect(result.address).toBeDefined();
      expect(result.address.startsWith('mn_shield_')).toBe(true);
    });

    it('should unlock wallet after creation', async () => {
      expect(wallet.isUnlocked).toBe(false);

      await wallet.createWallet('testpassword');

      expect(wallet.isUnlocked).toBe(true);
    });

    it('should update state after creation', async () => {
      await wallet.createWallet('testpassword');

      const state = await wallet.getState();
      expect(state.isUnlocked).toBe(true);
      expect(state.address).toBeDefined();
    });
  });

  describe('importWallet', () => {
    const validSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('should import wallet from valid seed', async () => {
      const address = await wallet.importWallet(validSeed, 'testpassword');

      expect(address).toBeDefined();
      expect(wallet.isUnlocked).toBe(true);
    });

    it('should reject invalid seed phrase', async () => {
      const invalidSeed = 'invalid seed phrase';

      await expect(wallet.importWallet(invalidSeed, 'testpassword')).rejects.toThrow('Invalid seed phrase');
    });

    it('should normalize seed phrase', async () => {
      const seedWithSpaces = '  ' + validSeed.toUpperCase() + '  ';
      const address = await wallet.importWallet(seedWithSpaces, 'testpassword');

      expect(address).toBeDefined();
    });
  });

  describe('lock/unlock', () => {
    it('should lock wallet and clear state', async () => {
      await wallet.createWallet('testpassword');
      expect(wallet.isUnlocked).toBe(true);

      await wallet.lock();

      expect(wallet.isUnlocked).toBe(false);
      const state = await wallet.getState();
      expect(state.address).toBeNull();
    });

    it('should unlock wallet with correct password', async () => {
      const password = 'testpassword';
      await wallet.createWallet(password);
      await wallet.lock();

      const result = await wallet.unlock(password);

      expect(result).toBe(true);
      expect(wallet.isUnlocked).toBe(true);
    });

    it.skip('should reject wrong password on unlock - requires real crypto', async () => {
      await wallet.createWallet('correctpassword');
      await wallet.lock();

      await expect(wallet.unlock('wrongpassword')).rejects.toThrow('Invalid password');
    });

    it('should throw error when unlocking without existing wallet', async () => {
      await expect(wallet.unlock('anypassword')).rejects.toThrow('No wallet found');
    });
  });

  describe('hasWallet', () => {
    it('should return false when no wallet exists', async () => {
      expect(await wallet.hasWallet()).toBe(false);
    });

    it('should return true after wallet creation', async () => {
      await wallet.createWallet('testpassword');
      expect(await wallet.hasWallet()).toBe(true);
    });
  });

  describe('getSeedPhrase', () => {
    it('should return seed phrase with correct password', async () => {
      const password = 'testpassword';
      const { seed: originalSeed } = await wallet.createWallet(password);
      await wallet.lock();

      const retrievedSeed = await wallet.getSeedPhrase(password);

      expect(retrievedSeed).toBe(originalSeed);
    });

    it('should throw error when no wallet exists', async () => {
      await expect(wallet.getSeedPhrase('anypassword')).rejects.toThrow('No wallet found');
    });
  });

  describe('state observable', () => {
    it('should emit state changes', async () => {
      const states: unknown[] = [];
      wallet.state$.subscribe((state) => states.push(state));

      await wallet.createWallet('testpassword');
      await wallet.lock();

      expect(states.length).toBeGreaterThan(1);
    });
  });
});
