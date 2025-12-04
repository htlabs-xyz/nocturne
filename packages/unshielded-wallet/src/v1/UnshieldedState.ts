import * as ledger from '@midnight-ntwrk/ledger-v6';
import { Data, HashSet, Option, pipe } from 'effect';

export interface UtxoMeta {
  readonly ctime: Date;
  readonly registeredForDustGeneration: boolean;
}

// Use Data.Class or Data.TaggedClass for proper structural equality
export class UtxoWithMeta extends Data.Class<{
  readonly utxo: ledger.Utxo;
  readonly meta: UtxoMeta;
}> {}

export type UpdateStatus = 'SUCCESS' | 'FAILURE';

export interface UnshieldedUpdate {
  readonly createdUtxos: readonly UtxoWithMeta[];
  readonly spentUtxos: readonly UtxoWithMeta[];
  readonly status: UpdateStatus;
}

export class UtxoNotFoundError extends Data.TaggedError('UtxoNotFoundError')<{
  readonly utxo: UtxoWithMeta | ledger.Utxo;
}> {}

export class ApplyTransactionError extends Data.TaggedError('ApplyTransactionError')<{
  readonly update: UnshieldedUpdate;
  readonly reason: string;
}> {}

export interface UnshieldedState {
  readonly availableUtxos: HashSet.HashSet<UtxoWithMeta>;
  readonly pendingUtxos: HashSet.HashSet<UtxoWithMeta>;
}

export const UnshieldedState = {
  empty: (): UnshieldedState => ({
    availableUtxos: HashSet.empty(),
    pendingUtxos: HashSet.empty(),
  }),

  restore: (available: readonly UtxoWithMeta[], pending: readonly UtxoWithMeta[]): UnshieldedState => ({
    availableUtxos: HashSet.fromIterable(available),
    pendingUtxos: HashSet.fromIterable(pending),
  }),

  spend: (state: UnshieldedState, utxo: UtxoWithMeta): UnshieldedState => {
    if (!HashSet.has(state.availableUtxos, utxo)) {
      throw new UtxoNotFoundError({ utxo });
    }
    return {
      availableUtxos: HashSet.remove(state.availableUtxos, utxo),
      pendingUtxos: HashSet.add(state.pendingUtxos, utxo),
    };
  },

  rollbackSpend: (state: UnshieldedState, utxo: UtxoWithMeta): UnshieldedState => ({
    availableUtxos: HashSet.add(state.availableUtxos, utxo),
    pendingUtxos: HashSet.remove(state.pendingUtxos, utxo),
  }),

  spendByUtxo: (state: UnshieldedState, utxo: ledger.Utxo): UnshieldedState =>
    pipe(
      Option.fromNullable(
        HashSet.toValues(state.availableUtxos).find(
          (u) => u.utxo.intentHash === utxo.intentHash && u.utxo.outputNo === utxo.outputNo,
        ),
      ),
      Option.getOrThrowWith(() => new UtxoNotFoundError({ utxo })),
      (found) => UnshieldedState.spend(state, found),
    ),

  rollbackSpendByUtxo: (state: UnshieldedState, utxo: ledger.Utxo): UnshieldedState =>
    pipe(
      Option.fromNullable(
        HashSet.toValues(state.pendingUtxos).find(
          (u) => u.utxo.intentHash === utxo.intentHash && u.utxo.outputNo === utxo.outputNo,
        ),
      ),
      Option.getOrThrowWith(() => new UtxoNotFoundError({ utxo })),
      (found) => UnshieldedState.rollbackSpend(state, found),
    ),

  applyUpdate: (state: UnshieldedState, update: UnshieldedUpdate): UnshieldedState => {
    if (update.status !== 'SUCCESS') {
      throw new ApplyTransactionError({ update, reason: `Invalid status: ${update.status}` });
    }
    return {
      availableUtxos: HashSet.union(state.availableUtxos, HashSet.fromIterable(update.createdUtxos)),
      pendingUtxos: HashSet.difference(state.pendingUtxos, HashSet.fromIterable(update.spentUtxos)),
    };
  },

  applyFailedUpdate: (state: UnshieldedState, update: UnshieldedUpdate): UnshieldedState => {
    if (update.status !== 'FAILURE') {
      throw new ApplyTransactionError({ update, reason: `Invalid status: ${update.status}` });
    }
    return {
      availableUtxos: HashSet.union(state.availableUtxos, HashSet.fromIterable(update.spentUtxos)),
      pendingUtxos: HashSet.difference(state.pendingUtxos, HashSet.fromIterable(update.spentUtxos)),
    };
  },

  toArrays: (state: UnshieldedState) => ({
    availableUtxos: HashSet.toValues(state.availableUtxos),
    pendingUtxos: HashSet.toValues(state.pendingUtxos),
  }),
} as const;
