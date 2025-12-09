import { BehaviorSubject, Observable } from 'rxjs';
import {
  generateMnemonicWords,
  validateMnemonic,
  joinMnemonicWords,
  HDWallet,
  Roles,
} from '@midnight-ntwrk/wallet-sdk-hd';
import {
  ShieldedAddress,
  ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import { SecretKeys } from '@midnight-ntwrk/zswap';
import { mnemonicToSeed } from '@scure/bip39';
import { StorageManager } from './storage';
import type { WalletState } from '@/shared/types/messages';

export const NETWORK_CONFIG = {
  networkId: 'testnet-02',
  indexerHttp: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
  indexerWs: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
  proofServer: 'https://lace-dev.proof-pub.stg.midnight.tools',
  nodeUrl: 'https://rpc.testnet-02.midnight.network',
};

export class WalletManager {
  private storage = new StorageManager();
  private stateSubject = new BehaviorSubject<WalletState>({
    isUnlocked: false,
    address: null,
    balance: null,
    isSynced: false,
  });
  private currentSeed: string | null = null;

  get state$(): Observable<WalletState> {
    return this.stateSubject.asObservable();
  }

  get isUnlocked(): boolean {
    return this.currentSeed !== null;
  }

  async initialize(): Promise<void> {
    const sessionSeed = await this.storage.getSessionSeed();
    if (sessionSeed) {
      this.currentSeed = sessionSeed;
      await this.updateState();
    }
  }

  async createWallet(password: string): Promise<{ seed: string; address: string }> {
    const words = generateMnemonicWords(256);
    const seed = joinMnemonicWords(words);

    const encrypted = await this.storage.encryptSeed(seed, password);
    await this.storage.saveEncryptedWallet(encrypted);
    await this.storage.saveSessionSeed(seed);

    this.currentSeed = seed;
    await this.updateState();

    const address = await this.deriveAddress(seed);
    return { seed, address };
  }

  async importWallet(seed: string, password: string): Promise<string> {
    const normalizedSeed = seed.trim().toLowerCase();

    if (!validateMnemonic(normalizedSeed)) {
      throw new Error('Invalid seed phrase');
    }

    const encrypted = await this.storage.encryptSeed(normalizedSeed, password);
    await this.storage.saveEncryptedWallet(encrypted);
    await this.storage.saveSessionSeed(normalizedSeed);

    this.currentSeed = normalizedSeed;
    await this.updateState();

    return this.deriveAddress(normalizedSeed);
  }

  async unlock(password: string): Promise<boolean> {
    const encrypted = await this.storage.getEncryptedWallet();
    if (!encrypted) {
      throw new Error('No wallet found');
    }

    try {
      const seed = await this.storage.decryptSeed(encrypted, password);
      await this.storage.saveSessionSeed(seed);
      this.currentSeed = seed;
      await this.updateState();
      return true;
    } catch {
      throw new Error('Invalid password');
    }
  }

  async lock(): Promise<void> {
    this.currentSeed = null;
    await this.storage.clearSession();
    this.stateSubject.next({
      isUnlocked: false,
      address: null,
      balance: null,
      isSynced: false,
    });
  }

  async hasWallet(): Promise<boolean> {
    return this.storage.hasWallet();
  }

  generateSeed(): string {
    const words = generateMnemonicWords(256);
    return joinMnemonicWords(words);
  }

  async getSeedPhrase(password: string): Promise<string> {
    const encrypted = await this.storage.getEncryptedWallet();
    if (!encrypted) {
      throw new Error('No wallet found');
    }

    try {
      const seed = await this.storage.decryptSeed(encrypted, password);
      return seed;
    } catch {
      throw new Error('Invalid password');
    }
  }

  async getState(): Promise<WalletState> {
    return this.stateSubject.getValue();
  }

  private async updateState(): Promise<void> {
    if (!this.currentSeed) {
      return;
    }

    const address = await this.deriveAddress(this.currentSeed);

    this.stateSubject.next({
      isUnlocked: true,
      address,
      balance: {
        shielded: '0',
        unshielded: '0',
        dust: '0',
      },
      isSynced: false,
    });
  }

  private async deriveAddress(seed: string): Promise<string> {
    const words = seed.split(' ');
    if (words.length !== 24) {
      throw new Error('Invalid seed phrase length');
    }

    const bip39Seed = await mnemonicToSeed(seed);
    const generatedWallet = HDWallet.fromSeed(bip39Seed);

    if (generatedWallet.type !== 'seedOk') {
      throw new Error('Error initializing HD Wallet');
    }

    const zswapKey = generatedWallet.hdWallet.selectAccount(0).selectRole(Roles.Zswap).deriveKeyAt(0);

    if (zswapKey.type !== 'keyDerived') {
      throw new Error('Error deriving key');
    }

    const walletSeed = zswapKey.key;
    const secretKeys = SecretKeys.fromSeed(walletSeed);

    const address = new ShieldedAddress(
      new ShieldedCoinPublicKey(Buffer.from(secretKeys.coinPublicKey, 'hex')),
      new ShieldedEncryptionPublicKey(Buffer.from(secretKeys.encryptionPublicKey, 'hex')),
    );

    return ShieldedAddress.codec.encode('test', address).asString();
  }
}
