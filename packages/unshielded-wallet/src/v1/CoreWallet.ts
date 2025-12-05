import { ProtocolVersion } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { createSyncProgress, SyncProgress, SyncProgressData } from './SyncProgress.js';
import { PublicKey } from '../KeyStore.js';
import { UnshieldedState, UnshieldedUpdate } from './UnshieldedState.js';
import * as ledger from '@midnight-ntwrk/ledger-v6';
import { Either, Array as Arr, pipe } from 'effect';
import { ApplyTransactionError, RollbackUtxoError, SpendUtxoError, WalletError } from './WalletError.js';

export type CoreWallet = Readonly<{
  state: UnshieldedState;
  publicKey: PublicKey;
  protocolVersion: ProtocolVersion.ProtocolVersion;
  progress: SyncProgress;
  networkId: string;
}>;

export const CoreWallet = {
  init(publicKey: PublicKey, networkId: string): CoreWallet {
    return {
      state: UnshieldedState.empty(),
      publicKey,
      protocolVersion: ProtocolVersion.MinSupportedVersion,
      progress: createSyncProgress(),
      networkId,
    };
  },

  restore(
    state: UnshieldedState,
    publicKey: PublicKey,
    syncProgress: Omit<SyncProgressData, 'isConnected'>,
    protocolVersion: ProtocolVersion.ProtocolVersion,
    networkId: string,
  ): CoreWallet {
    return {
      state,
      publicKey,
      protocolVersion,
      progress: createSyncProgress(syncProgress),
      networkId,
    };
  },

  updateProgress(
    wallet: CoreWallet,
    { appliedId, highestTransactionId, isConnected }: Partial<SyncProgressData>,
  ): CoreWallet {
    const progress = createSyncProgress({
      appliedId: appliedId ?? wallet.progress.appliedId,
      highestTransactionId: highestTransactionId ?? wallet.progress.highestTransactionId,
      isConnected: isConnected ?? wallet.progress.isConnected,
    });
    return { ...wallet, progress };
  },

  applyUpdate(coreWallet: CoreWallet, update: UnshieldedUpdate): Either.Either<CoreWallet, WalletError> {
    return UnshieldedState.applyUpdate(coreWallet.state, update).pipe(
      Either.map((state) => ({ ...coreWallet, state })),
      Either.mapLeft((error) => new ApplyTransactionError(error)),
    );
  },

  applyFailedUpdate(coreWallet: CoreWallet, update: UnshieldedUpdate): Either.Either<CoreWallet, WalletError> {
    return UnshieldedState.applyFailedUpdate(coreWallet.state, update).pipe(
      Either.map((state) => ({ ...coreWallet, state })),
      Either.mapLeft((error) => new ApplyTransactionError(error)),
    );
  },

  rollbackUtxo(coreWallet: CoreWallet, utxo: ledger.Utxo): Either.Either<CoreWallet, WalletError> {
    return UnshieldedState.rollbackSpendByUtxo(coreWallet.state, utxo).pipe(
      Either.map((state) => ({ ...coreWallet, state })),
      Either.mapLeft((error) => new RollbackUtxoError(error)),
    );
  },

  spend(coreWallet: CoreWallet, utxo: ledger.Utxo): Either.Either<CoreWallet, WalletError> {
    return UnshieldedState.spendByUtxo(coreWallet.state, utxo).pipe(
      Either.map((state) => ({ ...coreWallet, state })),
      Either.mapLeft((error) => new SpendUtxoError(error)),
    );
  },

  spendUtxos(
    wallet: CoreWallet,
    utxos: ReadonlyArray<ledger.Utxo>,
  ): Either.Either<[ReadonlyArray<ledger.Utxo>, CoreWallet], WalletError> {
    return pipe(
      utxos,
      Arr.reduce(
        Either.right([[], wallet.state]) as Either.Either<[ledger.Utxo[], UnshieldedState], WalletError>,
        (acc, utxoToSpend) =>
          acc.pipe(
            Either.flatMap(([accUtxos, state]) =>
              UnshieldedState.spendByUtxo(state, utxoToSpend).pipe(
                Either.map(
                  (nextState) => [accUtxos.concat([utxoToSpend]), nextState] as [ledger.Utxo[], UnshieldedState],
                ),
                Either.mapLeft((error) => new SpendUtxoError(error)),
              ),
            ),
          ),
      ),
      Either.map(
        ([spentUtxos, state]) => [spentUtxos, { ...wallet, state }] as [ReadonlyArray<ledger.Utxo>, CoreWallet],
      ),
    );
  },
};
