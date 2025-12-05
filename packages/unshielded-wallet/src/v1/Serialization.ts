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
import { Data, Either, HashSet } from 'effect';
import { CoreWallet, TransactionHistoryEntry } from './CoreWallet.js';
import { PublicKey } from '../KeyStore.js';
import { NetworkId, ProtocolVersion } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { Utxo } from '@midnight-ntwrk/wallet-sdk-unshielded-state';

export class SerializationError extends Data.TaggedError('SerializationError')<{ readonly message: string }> {}

export interface SerializationCapability<TState, TAux, TSerialized> {
  serialize(state: TState): TSerialized;
  deserialize(aux: TAux, serialized: TSerialized): Either.Either<TState, SerializationError>;
}

type SerializedCoreWallet = {
  version: number;
  publicKey: {
    address: string;
    publicKey: string;
  };
  address: string;
  networkId: string;
  protocolVersion: string;
  utxos: Array<{
    value: string;
    owner: string;
    type: string;
    intentHash: string;
    outputNo: number;
    registeredForDustGeneration: boolean;
    ctime?: number;
  }>;
  pendingUtxos: Array<{
    value: string;
    owner: string;
    type: string;
    intentHash: string;
    outputNo: number;
    registeredForDustGeneration: boolean;
    ctime?: number;
  }>;
  progress: {
    currentTransactionId: number;
    highestTransactionId: number;
  };
  txHistory: TransactionHistoryEntry[];
};

const serializeUtxo = (utxo: Utxo) => ({
  value: utxo.value.toString(),
  owner: utxo.owner,
  type: utxo.type,
  intentHash: utxo.intentHash,
  outputNo: utxo.outputNo,
  registeredForDustGeneration: utxo.registeredForDustGeneration,
  ctime: utxo.ctime,
});

const deserializeUtxo = (data: SerializedCoreWallet['utxos'][number]): Utxo => ({
  value: BigInt(data.value),
  owner: data.owner,
  type: data.type,
  intentHash: data.intentHash,
  outputNo: data.outputNo,
  registeredForDustGeneration: data.registeredForDustGeneration,
  ctime: data.ctime,
});

export const makeDefaultSerializationCapability = (
  _configuration: object,
  _getContext: () => object,
): SerializationCapability<CoreWallet, null, string> => ({
  serialize(state: CoreWallet): string {
    const serialized: SerializedCoreWallet = {
      version: 1,
      publicKey: {
        address: state.publicKey.address.hexString,
        publicKey: state.publicKey.publicKey.toString(),
      },
      address: state.address,
      networkId: state.networkId,
      protocolVersion: state.protocolVersion.toString(),
      utxos: HashSet.toValues(state.utxos).map(serializeUtxo),
      pendingUtxos: HashSet.toValues(state.pendingUtxos).map(serializeUtxo),
      progress: {
        currentTransactionId: Number(state.progress.appliedIndex),
        highestTransactionId: Number(state.progress.highestIndex),
      },
      txHistory: [...state.txHistory],
    };
    return JSON.stringify(serialized);
  },

  deserialize(_aux: null, serialized: string): Either.Either<CoreWallet, SerializationError> {
    return Either.try({
      try: () => {
        const data = JSON.parse(serialized) as SerializedCoreWallet;

        if (data.version !== 1) {
          throw new Error(`Unsupported serialization version: ${data.version}`);
        }

        const publicKey: PublicKey = {
          address: {
            hexString: data.publicKey.address,
          } as PublicKey['address'],
          publicKey: data.publicKey.publicKey as unknown as PublicKey['publicKey'],
        };

        const wallet: CoreWallet = {
          publicKey,
          address: data.address,
          networkId: data.networkId as NetworkId.NetworkId,
          protocolVersion: ProtocolVersion.ProtocolVersion(BigInt(data.protocolVersion)),
          utxos: HashSet.fromIterable(data.utxos.map(deserializeUtxo)),
          pendingUtxos: HashSet.fromIterable(data.pendingUtxos.map(deserializeUtxo)),
          progress: {
            appliedIndex: BigInt(data.progress.currentTransactionId),
            highestRelevantWalletIndex: BigInt(data.progress.highestTransactionId),
            highestIndex: BigInt(data.progress.highestTransactionId),
            highestRelevantIndex: BigInt(data.progress.highestTransactionId),
            isConnected: true,
            isCompleteWithin(gap: bigint): boolean {
              return this.highestRelevantWalletIndex - this.appliedIndex <= gap;
            },
          },
          txHistory: data.txHistory,
        };

        return wallet;
      },
      catch: (error) =>
        new SerializationError({
          message: `Failed to deserialize wallet state: ${error instanceof Error ? error.message : String(error)}`,
        }),
    });
  },
});
