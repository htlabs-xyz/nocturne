// This file is part of MIDNIGHT-WALLET-SDK.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { Data, HashSet, pipe, Schema, Scope, Stream } from 'effect';
import { CoreWallet, TransactionHistoryEntry } from './CoreWallet.js';
import { UnshieldedTransactions } from '@midnight-ntwrk/wallet-sdk-indexer-client';
import { UnshieldedTransactionSchema, Utxo } from '@midnight-ntwrk/wallet-sdk-unshielded-state';
import { WsSubscriptionClient } from '@midnight-ntwrk/wallet-sdk-indexer-client/effect';

const TransactionSchema = Schema.Struct({
  type: Schema.Literal('UnshieldedTransaction'),
  transaction: UnshieldedTransactionSchema,
});

const ProgressSchema = Schema.Struct({
  type: Schema.Literal('UnshieldedTransactionsProgress'),
  highestTransactionId: Schema.Number,
});

export const UnshieldedUpdateSchema = Schema.Union(TransactionSchema, ProgressSchema);
export type UnshieldedUpdate = Schema.Schema.Type<typeof UnshieldedUpdateSchema>;

const UnshieldedUpdateDecoder = Schema.decodeUnknown(UnshieldedUpdateSchema);

export class SyncError extends Data.TaggedError('SyncError')<{ readonly error?: unknown }> {}

export interface SyncService<TState, TStartAux, TUpdate> {
  updates(state: TState, startAux: TStartAux): Stream.Stream<TUpdate, SyncError, Scope.Scope>;
}

export interface SyncCapability<TState, TUpdate> {
  applyUpdate(state: TState, update: TUpdate): TState;
}

export type DefaultSyncConfiguration = {
  indexerUrl: string;
};

export type DefaultSyncContext = object;

export const makeEventsSyncService = (
  configuration: DefaultSyncConfiguration,
  _getContext: () => DefaultSyncContext,
): SyncService<CoreWallet, void, UnshieldedUpdate> => ({
  updates(state: CoreWallet, _startAux: void): Stream.Stream<UnshieldedUpdate, SyncError, Scope.Scope> {
    const transactionId = Number(state.progress.appliedIndex);

    return pipe(
      UnshieldedTransactions({ address: state.address, transactionId }),
      Stream.provideLayer(WsSubscriptionClient.layer({ url: configuration.indexerUrl })),
      Stream.mapEffect((message) => {
        const { type } = message.unshieldedTransactions;

        if (type === 'UnshieldedTransactionsProgress') {
          return UnshieldedUpdateDecoder({
            type,
            highestTransactionId: message.unshieldedTransactions.highestTransactionId,
          });
        } else {
          const { transaction, createdUtxos, spentUtxos } = message.unshieldedTransactions;
          const isRegularTransaction = transaction.type === 'RegularTransaction';
          const transactionResult = isRegularTransaction
            ? {
                status: transaction.transactionResult.status,
                segments:
                  transaction.transactionResult.segments?.map((segment) => ({
                    id: segment.id.toString(),
                    success: segment.success,
                  })) ?? null,
              }
            : null;

          return UnshieldedUpdateDecoder({
            type,
            transaction: {
              type: transaction.type,
              id: transaction.id,
              hash: transaction.hash,
              identifiers: isRegularTransaction ? transaction.identifiers : [],
              protocolVersion: transaction.protocolVersion,
              transactionResult,
              createdUtxos: createdUtxos.map((utxo) => ({
                value: utxo.value,
                owner: utxo.owner,
                type: utxo.tokenType,
                intentHash: utxo.intentHash,
                outputNo: utxo.outputIndex,
                registeredForDustGeneration: utxo.registeredForDustGeneration,
                ctime: utxo.ctime ? utxo.ctime * 1000 : undefined,
              })),
              spentUtxos: spentUtxos.map((utxo) => ({
                value: utxo.value,
                owner: utxo.owner,
                type: utxo.tokenType,
                intentHash: utxo.intentHash,
                outputNo: utxo.outputIndex,
                registeredForDustGeneration: utxo.registeredForDustGeneration,
                ctime: utxo.ctime ? utxo.ctime * 1000 : undefined,
              })),
            },
          });
        }
      }),
      Stream.mapError((error) => new SyncError({ error })),
    );
  },
});

export const makeEventsSyncCapability = (
  _configuration: DefaultSyncConfiguration,
  _getContext: () => DefaultSyncContext,
): SyncCapability<CoreWallet, UnshieldedUpdate> => ({
  applyUpdate(state: CoreWallet, update: UnshieldedUpdate): CoreWallet {
    if (update.type === 'UnshieldedTransactionsProgress') {
      return CoreWallet.updateProgress(state, {
        highestTransactionId: update.highestTransactionId,
      });
    }

    const { transaction } = update;
    let newState = state;

    for (const createdUtxo of transaction.createdUtxos) {
      const utxo: Utxo = {
        value: createdUtxo.value,
        owner: createdUtxo.owner,
        type: createdUtxo.type,
        intentHash: createdUtxo.intentHash,
        outputNo: createdUtxo.outputNo,
        registeredForDustGeneration: createdUtxo.registeredForDustGeneration,
        ctime: createdUtxo.ctime,
      };

      if (createdUtxo.owner === state.address) {
        newState = CoreWallet.addUtxo(newState, utxo);
      }

      newState = {
        ...newState,
        pendingUtxos: HashSet.filter(
          newState.pendingUtxos,
          (u) => u.intentHash !== utxo.intentHash || u.outputNo !== utxo.outputNo,
        ),
      };
    }

    for (const spentUtxo of transaction.spentUtxos) {
      const utxo: Utxo = {
        value: spentUtxo.value,
        owner: spentUtxo.owner,
        type: spentUtxo.type,
        intentHash: spentUtxo.intentHash,
        outputNo: spentUtxo.outputNo,
        registeredForDustGeneration: spentUtxo.registeredForDustGeneration,
        ctime: spentUtxo.ctime,
      };

      if (spentUtxo.owner === state.address) {
        newState = CoreWallet.removeUtxo(newState, utxo);
      }
    }

    const txEntry: TransactionHistoryEntry = {
      id: transaction.id,
      hash: transaction.hash,
      protocolVersion: transaction.protocolVersion,
      identifiers: transaction.identifiers ?? [],
      transactionResult: transaction.transactionResult
        ? {
            status: transaction.transactionResult.status as 'SUCCESS' | 'FAILURE' | 'PARTIAL_SUCCESS',
            segments: transaction.transactionResult.segments ?? [],
          }
        : null,
    };

    newState = CoreWallet.addTransaction(newState, txEntry);
    newState = CoreWallet.updateProgress(newState, { currentTransactionId: transaction.id });

    return newState;
  },
});
