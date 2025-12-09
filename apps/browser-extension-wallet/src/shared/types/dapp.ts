export interface DAppConnectorAPI {
  name: string;
  apiVersion: string;
  icon: string;
  isEnabled(): Promise<boolean>;
  enable(): Promise<DAppConnectorWalletAPI>;
  serviceUriConfig(): Promise<ServiceUriConfig>;
}

export interface DAppConnectorWalletAPI {
  state(): Promise<DAppConnectorWalletState>;
  balanceTransaction(tx: UnprovenTransaction, newCoins?: Coin[]): Promise<BalancedTransaction>;
  proveTransaction(tx: BalancedTransaction): Promise<ProvenTransaction>;
  balanceAndProveTransaction(tx: UnprovenTransaction, newCoins?: Coin[]): Promise<ProvenTransaction>;
  submitTransaction(tx: ProvenTransaction): Promise<string>;
}

export interface DAppConnectorWalletState {
  addressLegacy: string;
  address: string;
  coinPublicKeyLegacy: string;
  coinPublicKey: string;
  encryptionPublicKeyLegacy: string;
  encryptionPublicKey: string;
}

export interface ServiceUriConfig {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  substrateNodeUri: string;
}

export interface ConnectionRequest {
  origin: string;
  favicon?: string;
  title?: string;
  requestId: string;
}

export interface TransactionRequest {
  origin: string;
  tx: unknown;
  type: 'balance' | 'prove' | 'balanceAndProve' | 'submit';
  requestId: string;
}

export interface UnprovenTransaction {
  [key: string]: unknown;
}

export interface BalancedTransaction {
  [key: string]: unknown;
}

export interface ProvenTransaction {
  [key: string]: unknown;
}

export interface Coin {
  [key: string]: unknown;
}

export type DAppMessageType =
  | 'DAPP_REQUEST'
  | 'DAPP_RESPONSE'
  | 'APPROVE_CONNECTION'
  | 'REJECT_CONNECTION'
  | 'APPROVE_TRANSACTION'
  | 'REJECT_TRANSACTION';

export interface DAppRequestPayload {
  method: string;
  params?: unknown;
  origin: string;
}

export interface NocturneRequest {
  type: 'NOCTURNE_REQUEST';
  id: number;
  method: string;
  params?: unknown;
}

export interface NocturneResponse {
  type: 'NOCTURNE_RESPONSE';
  id: number;
  result?: unknown;
  error?: string;
}

export interface PendingDAppRequest {
  requestId: string;
  origin: string;
  method: string;
  params?: unknown;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

export class APIError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const API_ERROR_CODES = {
  REJECTED: 1,
  NOT_CONNECTED: 2,
  INTERNAL_ERROR: 3,
  INVALID_REQUEST: 4,
  NETWORK_ERROR: 5,
} as const;
