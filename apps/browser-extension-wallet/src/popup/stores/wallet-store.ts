import { create } from 'zustand';
import { createMessage } from '@/shared/types/messages';
import type { WalletState } from '@/shared/types/messages';

interface WalletStoreState {
  hasWallet: boolean;
  isUnlocked: boolean;
  address: string | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  generateSeed: () => Promise<string>;
  createWallet: (password: string) => Promise<{ seed: string; address: string }>;
  importWallet: (seed: string, password: string) => Promise<string>;
  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  getSeedPhrase: (password: string) => Promise<string>;
  clearError: () => void;
}

const MESSAGE_TIMEOUT = 30000;

async function sendMessage<T>(type: string, payload?: unknown): Promise<T> {
  const message = createMessage(type as any, payload);
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Message timeout: ${type}`));
    }, MESSAGE_TIMEOUT);

    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timeoutId);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response) {
        reject(new Error('No response from background'));
        return;
      }
      if (!response.success) {
        reject(new Error(response.error || 'Unknown error'));
        return;
      }
      resolve(response.data as T);
    });
  });
}

export const useWalletStore = create<WalletStoreState>((set) => ({
  hasWallet: false,
  isUnlocked: false,
  address: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('[WalletStore] Initializing...');
      const state = await sendMessage<WalletState & { hasWallet: boolean }>('GET_STATE');
      console.log('[WalletStore] Got state:', state);
      set({
        hasWallet: state.hasWallet,
        isUnlocked: state.isUnlocked,
        address: state.address,
        isLoading: false,
      });
    } catch (error) {
      console.error('[WalletStore] Init error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      });
    }
  },

  generateSeed: async () => {
    const result = await sendMessage<{ seed: string }>('GENERATE_SEED');
    return result.seed;
  },

  createWallet: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await sendMessage<{ seed: string; address: string }>('WALLET_CREATE', { password });
      set({
        hasWallet: true,
        isUnlocked: true,
        address: result.address,
        isLoading: false,
      });
      return result;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create wallet',
      });
      throw error;
    }
  },

  importWallet: async (seed: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[WalletStore] Importing wallet...');
      const result = await sendMessage<{ address: string }>('WALLET_IMPORT', { seed, password });
      console.log('[WalletStore] Import success:', result);
      set({
        hasWallet: true,
        isUnlocked: true,
        address: result.address,
        isLoading: false,
      });
      return result.address;
    } catch (error) {
      console.error('[WalletStore] Import error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to import wallet',
      });
      throw error;
    }
  },

  unlock: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      await sendMessage('WALLET_UNLOCK', { password });
      const state = await sendMessage<WalletState & { hasWallet: boolean }>('GET_STATE');
      set({
        isUnlocked: true,
        address: state.address,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unlock',
      });
      throw error;
    }
  },

  lock: async () => {
    set({ isLoading: true, error: null });
    try {
      await sendMessage('WALLET_LOCK');
      set({
        isUnlocked: false,
        address: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to lock',
      });
    }
  },

  getSeedPhrase: async (password: string) => {
    const result = await sendMessage<{ seed: string }>('GET_SEED_PHRASE', { password });
    return result.seed;
  },

  clearError: () => set({ error: null }),
}));
