import { WalletManager } from './wallet';
import { StorageManager } from './storage';
import type {
  Message,
  Response,
  WalletCreatePayload,
  WalletImportPayload,
  WalletUnlockPayload,
} from '@/shared/types/messages';
import { createResponse } from '@/shared/types/messages';

export class MessageRouter {
  private wallet: WalletManager;
  private storage: StorageManager;

  constructor(wallet: WalletManager) {
    this.wallet = wallet;
    this.storage = new StorageManager();
  }

  async handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<Response> {
    const { type, payload, id } = message;

    try {
      switch (type) {
        case 'PING':
          return createResponse(id, true, { pong: true });

        case 'GENERATE_SEED': {
          const seed = this.wallet.generateSeed();
          return createResponse(id, true, { seed });
        }

        case 'WALLET_CREATE': {
          const { password } = payload as WalletCreatePayload;
          const result = await this.wallet.createWallet(password);
          return createResponse(id, true, result);
        }

        case 'WALLET_IMPORT': {
          const { seed, password } = payload as WalletImportPayload;
          const address = await this.wallet.importWallet(seed, password);
          return createResponse(id, true, { address });
        }

        case 'WALLET_UNLOCK': {
          const { password } = payload as WalletUnlockPayload;
          await this.wallet.unlock(password);
          return createResponse(id, true);
        }

        case 'WALLET_LOCK': {
          await this.wallet.lock();
          return createResponse(id, true);
        }

        case 'GET_STATE': {
          const state = await this.wallet.getState();
          const hasWallet = await this.wallet.hasWallet();
          return createResponse(id, true, { ...state, hasWallet });
        }

        case 'GET_BALANCE': {
          const state = await this.wallet.getState();
          return createResponse(id, true, state.balance);
        }

        case 'CONNECT_DAPP': {
          const origin = this.getOrigin(sender);
          if (!origin) {
            return createResponse(id, false, undefined, 'Invalid origin');
          }
          await this.storage.addConnectedSite(origin);
          return createResponse(id, true, { connected: true });
        }

        case 'DISCONNECT_DAPP': {
          const origin = this.getOrigin(sender);
          if (!origin) {
            return createResponse(id, false, undefined, 'Invalid origin');
          }
          await this.storage.removeConnectedSite(origin);
          return createResponse(id, true);
        }

        case 'GET_CONNECTED_SITES': {
          const sites = await this.storage.getConnectedSites();
          return createResponse(id, true, sites);
        }

        case 'SIGN_TRANSACTION': {
          if (!this.wallet.isUnlocked) {
            return createResponse(id, false, undefined, 'Wallet is locked');
          }
          return createResponse(id, false, undefined, 'Not implemented yet');
        }

        case 'SEND_TRANSACTION': {
          if (!this.wallet.isUnlocked) {
            return createResponse(id, false, undefined, 'Wallet is locked');
          }
          return createResponse(id, false, undefined, 'Not implemented yet');
        }

        default:
          return createResponse(id, false, undefined, `Unknown message type: ${type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createResponse(id, false, undefined, errorMessage);
    }
  }

  private getOrigin(sender: chrome.runtime.MessageSender): string | null {
    if (sender.origin) {
      return sender.origin;
    }
    if (sender.url) {
      try {
        return new URL(sender.url).origin;
      } catch {
        return null;
      }
    }
    return null;
  }
}
