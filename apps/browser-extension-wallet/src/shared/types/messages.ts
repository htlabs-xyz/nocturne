export type MessageType =
  | 'WALLET_UNLOCK'
  | 'WALLET_LOCK'
  | 'WALLET_CREATE'
  | 'WALLET_IMPORT'
  | 'GENERATE_SEED'
  | 'GET_STATE'
  | 'GET_BALANCE'
  | 'GET_SEED_PHRASE'
  | 'SEND_TRANSACTION'
  | 'SIGN_TRANSACTION'
  | 'CONNECT_DAPP'
  | 'DISCONNECT_DAPP'
  | 'GET_CONNECTED_SITES'
  | 'DAPP_REQUEST'
  | 'APPROVE_CONNECTION'
  | 'REJECT_CONNECTION'
  | 'APPROVE_TRANSACTION'
  | 'REJECT_TRANSACTION'
  | 'GET_PENDING_REQUEST'
  | 'PING';

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
  id: string;
}

export interface Response<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  id: string;
}

export interface WalletCreatePayload {
  password: string;
}

export interface WalletImportPayload {
  seed: string;
  password: string;
}

export interface WalletUnlockPayload {
  password: string;
}

export interface GetSeedPhrasePayload {
  password: string;
}

export interface GetSeedPhraseResponse {
  seed: string;
}

export interface WalletCreateResponse {
  seed: string;
  address: string;
}

export interface WalletImportResponse {
  address: string;
}

export interface WalletBalance {
  shielded: string;
  unshielded: string;
  dust: string;
}

export interface WalletState {
  isUnlocked: boolean;
  address: string | null;
  balance: WalletBalance | null;
  isSynced: boolean;
  coinPublicKey?: string;
  encryptionPublicKey?: string;
}

export interface ConnectDappResponse {
  connected: boolean;
}

export function createMessage<T>(type: MessageType, payload?: T): Message<T> {
  return {
    type,
    payload,
    id: crypto.randomUUID(),
  };
}

export function createResponse<T>(id: string, success: boolean, data?: T, error?: string): Response<T> {
  return {
    success,
    data,
    error,
    id,
  };
}
