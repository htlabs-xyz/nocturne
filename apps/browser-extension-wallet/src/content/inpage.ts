import type {
  DAppConnectorAPI,
  DAppConnectorWalletAPI,
  DAppConnectorWalletState,
  ServiceUriConfig,
  UnprovenTransaction,
  BalancedTransaction,
  ProvenTransaction,
  Coin,
} from '@/shared/types/dapp';

declare global {
  interface Window {
    midnight?: {
      nocturne?: DAppConnectorAPI;
      [walletName: string]: DAppConnectorAPI | undefined;
    };
  }
}

const WALLET_NAME = 'nocturne';
const API_VERSION = '1.0.0';
const WALLET_ICON = '';

class WalletAPI implements DAppConnectorWalletAPI {
  private requestId = 0;
  private readonly origin = window.location.origin;

  private request<T>(method: string, params?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;

      const handler = (event: MessageEvent) => {
        if (event.origin !== this.origin) return;
        if (event.data?.type === 'NOCTURNE_RESPONSE' && event.data.id === id) {
          window.removeEventListener('message', handler);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      window.addEventListener('message', handler);
      window.postMessage({ type: 'NOCTURNE_REQUEST', id, method, params }, this.origin);
    });
  }

  async state(): Promise<DAppConnectorWalletState> {
    return this.request<DAppConnectorWalletState>('state');
  }

  async balanceTransaction(tx: UnprovenTransaction, newCoins?: Coin[]): Promise<BalancedTransaction> {
    return this.request<BalancedTransaction>('balanceTransaction', { tx, newCoins });
  }

  async proveTransaction(tx: BalancedTransaction): Promise<ProvenTransaction> {
    return this.request<ProvenTransaction>('proveTransaction', { tx });
  }

  async balanceAndProveTransaction(tx: UnprovenTransaction, newCoins?: Coin[]): Promise<ProvenTransaction> {
    return this.request<ProvenTransaction>('balanceAndProveTransaction', { tx, newCoins });
  }

  async submitTransaction(tx: ProvenTransaction): Promise<string> {
    return this.request<string>('submitTransaction', { tx });
  }
}

class NocturneProvider implements DAppConnectorAPI {
  readonly name = WALLET_NAME;
  readonly apiVersion = API_VERSION;
  readonly icon = WALLET_ICON;

  private requestId = 0;
  private walletApi: WalletAPI | null = null;
  private readonly origin = window.location.origin;

  private request<T>(method: string, params?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;

      const handler = (event: MessageEvent) => {
        if (event.origin !== this.origin) return;
        if (event.data?.type === 'NOCTURNE_RESPONSE' && event.data.id === id) {
          window.removeEventListener('message', handler);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      window.addEventListener('message', handler);
      window.postMessage({ type: 'NOCTURNE_REQUEST', id, method, params }, this.origin);
    });
  }

  async isEnabled(): Promise<boolean> {
    return this.request<boolean>('isEnabled');
  }

  async enable(): Promise<DAppConnectorWalletAPI> {
    await this.request<void>('enable');
    if (!this.walletApi) {
      this.walletApi = new WalletAPI();
    }
    return this.walletApi;
  }

  async serviceUriConfig(): Promise<ServiceUriConfig> {
    return this.request<ServiceUriConfig>('serviceUriConfig');
  }
}

if (typeof window.midnight === 'undefined') {
  window.midnight = {};
}
window.midnight.nocturne = new NocturneProvider();

window.dispatchEvent(
  new CustomEvent('midnight:announceProvider', {
    detail: { name: WALLET_NAME, provider: window.midnight.nocturne },
  }),
);
