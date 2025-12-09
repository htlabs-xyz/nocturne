import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageRouter } from './message-router';
import { WalletManager } from './wallet';
import { createMessage } from '@/shared/types/messages';
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

describe('MessageRouter', () => {
  let router: MessageRouter;
  let wallet: WalletManager;
  const mockSender: chrome.runtime.MessageSender = {
    origin: 'https://example.com',
    id: 'test-extension-id',
  };

  beforeEach(() => {
    clearMockStorage();
    vi.clearAllMocks();
    wallet = new WalletManager();
    router = new MessageRouter(wallet);
  });

  describe('PING', () => {
    it('should respond to ping', async () => {
      const message = createMessage('PING');

      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ pong: true });
    });
  });

  describe('WALLET_CREATE', () => {
    it('should create a wallet and return seed and address', async () => {
      const message = createMessage('WALLET_CREATE', { password: 'testpassword' });

      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('seed');
      expect(response.data).toHaveProperty('address');
    });
  });

  describe('WALLET_IMPORT', () => {
    const validSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('should import wallet with valid seed', async () => {
      const message = createMessage('WALLET_IMPORT', {
        seed: validSeed,
        password: 'testpassword',
      });

      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('address');
    });

    it('should fail with invalid seed', async () => {
      const message = createMessage('WALLET_IMPORT', {
        seed: 'invalid seed',
        password: 'testpassword',
      });

      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid seed phrase');
    });
  });

  describe('WALLET_LOCK/UNLOCK', () => {
    beforeEach(async () => {
      const createMsg = createMessage('WALLET_CREATE', { password: 'testpassword' });
      await router.handleMessage(createMsg, mockSender);
    });

    it('should lock wallet', async () => {
      const message = createMessage('WALLET_LOCK');

      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(true);
      expect(wallet.isUnlocked).toBe(false);
    });

    it('should unlock wallet with correct password', async () => {
      await router.handleMessage(createMessage('WALLET_LOCK'), mockSender);

      const message = createMessage('WALLET_UNLOCK', { password: 'testpassword' });
      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(true);
      expect(wallet.isUnlocked).toBe(true);
    });

    it.skip('should fail unlock with wrong password - requires real crypto', async () => {
      await router.handleMessage(createMessage('WALLET_LOCK'), mockSender);

      const message = createMessage('WALLET_UNLOCK', { password: 'wrongpassword' });
      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid password');
    });
  });

  describe('GET_STATE', () => {
    it('should return state with hasWallet flag', async () => {
      const message = createMessage('GET_STATE');

      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('hasWallet');
      expect(response.data).toHaveProperty('isUnlocked');
    });
  });

  describe('GET_SEED_PHRASE', () => {
    const password = 'testpassword';

    beforeEach(async () => {
      const createMsg = createMessage('WALLET_CREATE', { password });
      await router.handleMessage(createMsg, mockSender);
    });

    it('should return seed phrase with correct password', async () => {
      const message = createMessage('GET_SEED_PHRASE', { password });

      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('seed');
      const seed = (response.data as { seed: string }).seed;
      expect(seed.split(' ').length).toBe(24);
    });

    it('should fail when no wallet exists', async () => {
      clearMockStorage();
      const newWallet = new WalletManager();
      const newRouter = new MessageRouter(newWallet);
      const message = createMessage('GET_SEED_PHRASE', { password: 'anypassword' });

      const response = await newRouter.handleMessage(message, mockSender);

      expect(response.success).toBe(false);
      expect(response.error).toBe('No wallet found');
    });
  });

  describe('connected sites', () => {
    it('should connect and disconnect dapps', async () => {
      const connectMsg = createMessage('CONNECT_DAPP');
      const connectResponse = await router.handleMessage(connectMsg, mockSender);
      expect(connectResponse.success).toBe(true);

      const getSitesMsg = createMessage('GET_CONNECTED_SITES');
      const getSitesResponse = await router.handleMessage(getSitesMsg, mockSender);
      expect(getSitesResponse.data).toContain('https://example.com');

      const disconnectMsg = createMessage('DISCONNECT_DAPP');
      await router.handleMessage(disconnectMsg, mockSender);

      const afterDisconnect = await router.handleMessage(getSitesMsg, mockSender);
      expect(afterDisconnect.data).not.toContain('https://example.com');
    });
  });

  describe('transaction operations', () => {
    it('should reject sign transaction when wallet is locked', async () => {
      const message = createMessage('SIGN_TRANSACTION', { tx: {} });

      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Wallet is locked');
    });

    it('should reject send transaction when wallet is locked', async () => {
      const message = createMessage('SEND_TRANSACTION', { tx: {} });

      const response = await router.handleMessage(message, mockSender);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Wallet is locked');
    });
  });

  describe('unknown message type', () => {
    it('should return error for unknown message type', async () => {
      const message = { type: 'UNKNOWN_TYPE', id: 'test-id' };

      const response = await router.handleMessage(message as any, mockSender);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown message type');
    });
  });
});
