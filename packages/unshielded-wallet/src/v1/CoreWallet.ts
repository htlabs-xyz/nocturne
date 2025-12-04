import { ProtocolVersion } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { createSyncProgress, SyncProgress, SyncProgressData } from './SyncProgress.js';
import { PublicKeys } from '../KeyStore.js';
import { UnshieldedState, UnshieldedUpdate } from './UnshieldedState.js';
import * as ledger from '@midnight-ntwrk/ledger-v6';
import { pipe, Array as Arr } from 'effect';

export type CoreWallet = Readonly<{
  state: UnshieldedState;
  publicKeys: PublicKeys;
  protocolVersion: ProtocolVersion.ProtocolVersion;
  progress: SyncProgress;
  networkId: string;
}>;

export const CoreWallet = {
  init(publicKeys: PublicKeys, networkId: string): CoreWallet {
    return {
      state: UnshieldedState.empty(),
      publicKeys,
      protocolVersion: ProtocolVersion.MinSupportedVersion,
      progress: createSyncProgress(),
      networkId,
    };
  },

  restore(
    state: UnshieldedState,
    publicKeys: PublicKeys,
    syncProgress: Omit<SyncProgressData, 'isConnected'>,
    protocolVersion: ProtocolVersion.ProtocolVersion,
    networkId: string,
  ): CoreWallet {
    return {
      state,
      publicKeys,
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

  applyUpdate(coreWallet: CoreWallet, update: UnshieldedUpdate): CoreWallet {
    return { ...coreWallet, state: UnshieldedState.applyUpdate(coreWallet.state, update) };
  },

  applyFailedUpdate(coreWallet: CoreWallet, update: UnshieldedUpdate): CoreWallet {
    return { ...coreWallet, state: UnshieldedState.applyFailedUpdate(coreWallet.state, update) };
  },

  rollbackUtxo(coreWallet: CoreWallet, utxo: ledger.Utxo): CoreWallet {
    return { ...coreWallet, state: UnshieldedState.rollbackSpendByUtxo(coreWallet.state, utxo) };
  },

  spend(coreWallet: CoreWallet, utxo: ledger.Utxo): CoreWallet {
    const newState = UnshieldedState.spendByUtxo(coreWallet.state, utxo);
    return { ...coreWallet, state: newState };
  },

  spendUtxos(wallet: CoreWallet, utxos: ReadonlyArray<ledger.Utxo>): [ReadonlyArray<ledger.Utxo>, CoreWallet] {
    const [spentUtxos, state] = pipe(
      utxos,
      Arr.reduce(
        [[], wallet.state] as [ReadonlyArray<ledger.Utxo>, UnshieldedState],
        ([accUtxos, state], utxoToSpend) => {
          const nextState = UnshieldedState.spendByUtxo(state, utxoToSpend);

          return [accUtxos.concat([utxoToSpend]), nextState] as [ReadonlyArray<ledger.Utxo>, UnshieldedState];
        },
      ),
    );
    const updated: CoreWallet = { ...wallet, state };
    return [spentUtxos, updated];
  },
};
