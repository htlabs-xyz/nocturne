import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager } from './storage';
import { clearMockStorage } from '@/test/setup';

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    storage = new StorageManager();
    clearMockStorage();
  });

  describe('encryption/decryption', () => {
    it('should encrypt and decrypt seed correctly', async () => {
      const seed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const password = 'testpassword123';

      const encrypted = await storage.encryptSeed(seed, password);

      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.encrypted).not.toBe(seed);

      const decrypted = await storage.decryptSeed(encrypted, password);
      expect(decrypted).toBe(seed);
    });

    it.skip('should fail decryption with wrong password - requires real crypto', async () => {
      const seed = 'test seed phrase for decryption failure';
      const password = 'correctpassword';
      const wrongPassword = 'wrongpassword';

      const encrypted = await storage.encryptSeed(seed, password);

      await expect(storage.decryptSeed(encrypted, wrongPassword)).rejects.toThrow();
    });

    it.skip('should produce different ciphertext for same seed - requires real crypto', async () => {
      const seed = 'test seed phrase for uniqueness check';
      const password = 'testpassword';

      const encrypted1 = await storage.encryptSeed(seed, password);
      const encrypted2 = await storage.encryptSeed(seed, password);

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('wallet storage', () => {
    it('should save and retrieve encrypted wallet', async () => {
      const encryptedData = {
        encrypted: 'encryptedData',
        salt: 'saltValue',
        iv: 'ivValue',
      };

      await storage.saveEncryptedWallet(encryptedData);
      const retrieved = await storage.getEncryptedWallet();

      expect(retrieved).toEqual(encryptedData);
    });

    it('should return null when no wallet exists', async () => {
      const result = await storage.getEncryptedWallet();
      expect(result).toBeNull();
    });

    it('should detect wallet existence', async () => {
      expect(await storage.hasWallet()).toBe(false);

      await storage.saveEncryptedWallet({
        encrypted: 'test',
        salt: 'salt',
        iv: 'iv',
      });

      expect(await storage.hasWallet()).toBe(true);
    });
  });

  describe('session storage', () => {
    it('should save and retrieve session seed', async () => {
      const seed = 'session test seed';

      await storage.saveSessionSeed(seed);
      const retrieved = await storage.getSessionSeed();

      expect(retrieved).toBe(seed);
    });

    it('should clear session data', async () => {
      await storage.saveSessionSeed('test seed');
      await storage.clearSession();

      const result = await storage.getSessionSeed();
      expect(result).toBeNull();
    });
  });

  describe('connected sites', () => {
    it('should add and retrieve connected sites', async () => {
      await storage.addConnectedSite('https://example.com');
      await storage.addConnectedSite('https://test.com');

      const sites = await storage.getConnectedSites();
      expect(sites).toContain('https://example.com');
      expect(sites).toContain('https://test.com');
    });

    it('should not add duplicate sites', async () => {
      await storage.addConnectedSite('https://example.com');
      await storage.addConnectedSite('https://example.com');

      const sites = await storage.getConnectedSites();
      expect(sites.length).toBe(1);
    });

    it('should remove connected sites', async () => {
      await storage.addConnectedSite('https://example.com');
      await storage.addConnectedSite('https://test.com');
      await storage.removeConnectedSite('https://example.com');

      const sites = await storage.getConnectedSites();
      expect(sites).not.toContain('https://example.com');
      expect(sites).toContain('https://test.com');
    });
  });
});
