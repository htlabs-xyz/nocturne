import { WalletManager, NETWORK_CONFIG } from './wallet';
import { StorageManager } from './storage';
import type {
  DAppConnectorWalletState,
  ServiceUriConfig,
  PendingDAppRequest,
} from '@/shared/types/dapp';

const REQUEST_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

interface PendingRequestWithMeta extends PendingDAppRequest {
  createdAt: number;
  windowId?: number;
}

export class DAppHandler {
  private wallet: WalletManager;
  private storage: StorageManager;
  private pendingRequests = new Map<string, PendingRequestWithMeta>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(wallet: WalletManager) {
    this.wallet = wallet;
    this.storage = new StorageManager();
    this.startCleanupInterval();
    this.setupWindowCloseListener();
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [requestId, request] of this.pendingRequests.entries()) {
        if (now - request.createdAt > REQUEST_TTL_MS) {
          request.reject(new Error('Request timeout'));
          this.pendingRequests.delete(requestId);
        }
      }
    }, CLEANUP_INTERVAL_MS);
  }

  private setupWindowCloseListener(): void {
    chrome.windows.onRemoved.addListener((windowId) => {
      for (const [requestId, request] of this.pendingRequests.entries()) {
        if (request.windowId === windowId) {
          request.reject(new Error('User closed popup'));
          this.pendingRequests.delete(requestId);
        }
      }
    });
  }

  async handleRequest(method: string, params: unknown, origin: string): Promise<unknown> {
    switch (method) {
      case 'isEnabled':
        return this.isEnabled(origin);

      case 'enable':
        return this.requestConnection(origin);

      case 'state':
        await this.requireConnection(origin);
        return this.getWalletState();

      case 'balanceTransaction':
        await this.requireConnection(origin);
        return this.requestApproval('balance', params, origin);

      case 'proveTransaction':
        await this.requireConnection(origin);
        return this.requestApproval('prove', params, origin);

      case 'balanceAndProveTransaction':
        await this.requireConnection(origin);
        return this.requestApproval('balanceAndProve', params, origin);

      case 'submitTransaction':
        await this.requireConnection(origin);
        return this.requestApproval('submit', params, origin);

      case 'serviceUriConfig':
        return this.getServiceUriConfig();

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  private async isEnabled(origin: string): Promise<boolean> {
    const sites = await this.storage.getConnectedSites();
    return sites.includes(origin);
  }

  private async requireConnection(origin: string): Promise<void> {
    const isConnected = await this.isEnabled(origin);
    if (!isConnected) {
      throw new Error('Site not connected');
    }
  }

  private async requestConnection(origin: string): Promise<void> {
    const isAlreadyConnected = await this.isEnabled(origin);
    const state = await this.wallet.getState();
    const isLocked = !state?.isUnlocked;

    if (isAlreadyConnected && !isLocked) {
      return;
    }

    const requestId = crypto.randomUUID();
    const needsUnlock = isLocked;
    const needsApproval = !isAlreadyConnected;

    return new Promise((resolve, reject) => {
      let popupUrl: string;

      if (needsUnlock) {
        popupUrl = chrome.runtime.getURL(
          `popup.html#/dapp-unlock?requestId=${requestId}&origin=${encodeURIComponent(origin)}&needsApproval=${needsApproval}`,
        );
      } else {
        popupUrl = chrome.runtime.getURL(
          `popup.html#/connect?requestId=${requestId}&origin=${encodeURIComponent(origin)}`,
        );
      }

      chrome.windows.create(
        {
          url: popupUrl,
          type: 'popup',
          width: 380,
          height: 620,
          focused: true,
        },
        (window) => {
          this.pendingRequests.set(requestId, {
            requestId,
            origin,
            method: 'enable',
            resolve: () => resolve(),
            reject,
            createdAt: Date.now(),
            windowId: window?.id,
          });
        },
      );
    });
  }

  private async requestApproval(
    type: 'balance' | 'prove' | 'balanceAndProve' | 'submit',
    params: unknown,
    origin: string,
  ): Promise<unknown> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const popupUrl = chrome.runtime.getURL(
        `popup.html#/approve?requestId=${requestId}&type=${type}&origin=${encodeURIComponent(origin)}`,
      );

      chrome.windows.create(
        {
          url: popupUrl,
          type: 'popup',
          width: 380,
          height: 620,
          focused: true,
        },
        (window) => {
          this.pendingRequests.set(requestId, {
            requestId,
            origin,
            method: type,
            params,
            resolve,
            reject,
            createdAt: Date.now(),
            windowId: window?.id,
          });
        },
      );
    });
  }

  async approveConnection(requestId: string, origin: string): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    await this.storage.addConnectedSite(origin);
    request.resolve(undefined);
    this.pendingRequests.delete(requestId);
  }

  async rejectConnection(requestId: string): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      return;
    }

    request.reject(new Error('User rejected connection'));
    this.pendingRequests.delete(requestId);
  }

  async approveTransaction(requestId: string): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    request.resolve({ approved: true, params: request.params });
    this.pendingRequests.delete(requestId);
  }

  async rejectTransaction(requestId: string): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      return;
    }

    request.reject(new Error('User rejected transaction'));
    this.pendingRequests.delete(requestId);
  }

  getPendingRequest(requestId: string): PendingDAppRequest | undefined {
    return this.pendingRequests.get(requestId);
  }

  handlePopupClose(requestId: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      request.reject(new Error('User closed popup'));
      this.pendingRequests.delete(requestId);
    }
  }

  private async getWalletState(): Promise<DAppConnectorWalletState> {
    const state = await this.wallet.getState();

    if (!state?.isUnlocked) {
      throw new Error('Wallet is locked');
    }

    const address = state.address ?? '';
    const coinPublicKey = state.coinPublicKey ?? '';
    const encryptionPublicKey = state.encryptionPublicKey ?? '';

    return {
      address,
      addressLegacy: coinPublicKey && encryptionPublicKey ? `${coinPublicKey}|${encryptionPublicKey}` : '',
      coinPublicKey,
      coinPublicKeyLegacy: coinPublicKey,
      encryptionPublicKey,
      encryptionPublicKeyLegacy: encryptionPublicKey,
    };
  }

  private getServiceUriConfig(): ServiceUriConfig {
    return {
      indexerUri: NETWORK_CONFIG.indexerHttp,
      indexerWsUri: NETWORK_CONFIG.indexerWs,
      proverServerUri: NETWORK_CONFIG.proofServer,
      substrateNodeUri: NETWORK_CONFIG.nodeUrl,
    };
  }
}
