import { Data } from 'effect';
import * as ledger from '@midnight-ntwrk/ledger-v6';

export const WalletError = {
  other(err: unknown): WalletError {
    let message: string;
    if (err) {
      if (typeof err == 'object' && 'message' in err) {
        message = String(err.message);
      } else if (typeof err == 'string') {
        message = err;
      } else {
        message = '';
      }
    } else {
      message = '';
    }
    return new OtherWalletError({ message: `Other wallet error: ${message}`, cause: err });
  },
};
export type WalletError =
  | OtherWalletError
  | InsufficientFundsError
  | AddressError
  | SyncWalletError
  | TransactingError
  | SignError
  | ApplyTransactionError
  | RollbackUtxoError
  | SpendUtxoError;

export class OtherWalletError extends Data.TaggedError('Wallet.Other')<{
  message: string;
  cause?: unknown;
}> {}

export class SyncWalletError extends Data.TaggedError('Wallet.Sync')<{
  message: string;
  cause?: unknown;
}> {}

export class InsufficientFundsError extends Data.TaggedError('Wallet.InsufficientFunds')<{
  message: string;
  tokenType: ledger.RawTokenType;
  amount: bigint;
}> {}

export class AddressError extends Data.TaggedError('Wallet.Address')<{
  message: string;
  originalAddress: string;
  cause?: unknown;
}> {}

export class TransactingError extends Data.TaggedError('Wallet.Transacting')<{
  message: string;
  cause?: unknown;
}> {}

export class SignError extends Data.TaggedError('Wallet.Sign')<{
  message: string;
  cause?: unknown;
}> {}

export class ApplyTransactionError extends Data.TaggedError('Wallet.ApplyTransaction')<{
  message: string;
  cause?: unknown;
}> {}

export class RollbackUtxoError extends Data.TaggedError('Wallet.RollbackUtxo')<{
  message: string;
  utxo: ledger.Utxo;
  cause?: unknown;
}> {}

export class SpendUtxoError extends Data.TaggedError('Wallet.SpendUtxo')<{
  message: string;
  utxo: ledger.Utxo;
  cause?: unknown;
}> {}

export class UtxoNotFoundError extends Data.TaggedError('UtxoNotFoundError')<{
  readonly utxo: ledger.Utxo;
}> {}
