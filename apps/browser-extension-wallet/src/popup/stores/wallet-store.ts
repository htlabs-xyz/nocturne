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
  clearError: () => void;
}

async function sendMessage<T>(type: string, payload?: unknown): Promise<T> {
  const message = createMessage(type as any, payload);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
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
      const state = await sendMessage<WalletState & { hasWallet: boolean }>('GET_STATE');
      set({
        hasWallet: state.hasWallet,
        isUnlocked: state.isUnlocked,
        address: state.address,
        isLoading: false,
      });
    } catch (error) {
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
      const result = await sendMessage<{ address: string }>('WALLET_IMPORT', { seed, password });
      set({
        hasWallet: true,
        isUnlocked: true,
        address: result.address,
        isLoading: false,
      });
      return result.address;
    } catch (error) {
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

  clearError: () => set({ error: null }),
}));
