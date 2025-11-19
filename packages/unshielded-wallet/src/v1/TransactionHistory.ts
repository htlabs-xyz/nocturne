import * as ledger from '@midnight-ntwrk/ledger-v6';
import { CoreWallet } from './CoreWallet.js';

export type ProgressUpdate = {
  appliedIndex: bigint | undefined;
  highestRelevantWalletIndex: bigint | undefined;
  highestIndex: bigint | undefined;
  highestRelevantIndex: bigint | undefined;
};

export type TransactionHistoryCapability<TState, TTransaction> = {
  updateTxHistory(state: TState, newTxs: TTransaction[]): TState;
  transactionHistory(state: TState): readonly TTransaction[];
  progress(state: TState): ProgressUpdate;
};

export const makeDefaultTransactionHistoryCapability = (): TransactionHistoryCapability<
  CoreWallet,
  ledger.UnprovenTransaction
> => {
  return {
    updateTxHistory: (state: CoreWallet): CoreWallet => {
      return state;
    },
    transactionHistory: (): readonly ledger.UnprovenTransaction[] => {
      return [];
    },
    progress: (): ProgressUpdate => {
      return {
        appliedIndex: undefined,
        highestRelevantWalletIndex: undefined,
        highestIndex: undefined,
        highestRelevantIndex: undefined,
      };
    },
  };
};

export const makeSimulatorTransactionHistoryCapability = (): TransactionHistoryCapability<
  CoreWallet,
  ledger.ProofErasedTransaction
> => {
  return {
    updateTxHistory: (state: CoreWallet, newTxs: ledger.ProofErasedTransaction[]): CoreWallet => {
      return state;
    },
    transactionHistory: (state: CoreWallet): readonly ledger.ProofErasedTransaction[] => {
      return [];
    },
    progress: (state: CoreWallet): ProgressUpdate => {
      return {
        appliedIndex: undefined,
        highestRelevantWalletIndex: undefined,
        highestIndex: undefined,
        highestRelevantIndex: undefined,
      };
    },
  };
};

export const makeDiscardTransactionHistoryCapability = (): TransactionHistoryCapability<
  CoreWallet,
  ledger.FinalizedTransaction
> => {
  return {
    updateTxHistory: (state: CoreWallet): CoreWallet => {
      return state;
    },
    transactionHistory: (state: CoreWallet): readonly ledger.FinalizedTransaction[] => {
      return [];
    },
    progress: (state: CoreWallet): ProgressUpdate => {
      return {
        appliedIndex: undefined,
        highestRelevantWalletIndex: undefined,
        highestIndex: undefined,
        highestRelevantIndex: undefined,
      };
    },
  };
};
