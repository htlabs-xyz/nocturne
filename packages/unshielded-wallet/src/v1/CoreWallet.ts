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
import { HashSet } from 'effect';
import { ProtocolVersion, NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { Utxo, UnshieldedStateData } from '@midnight-ntwrk/wallet-sdk-unshielded-state';
import { PublicKey } from '../KeyStore.js';

export type SyncProgressData = {
  readonly currentTransactionId: number;
  readonly highestTransactionId: number;
};

export type SyncProgress = {
  readonly appliedIndex: bigint;
  readonly highestRelevantWalletIndex: bigint;
  readonly highestIndex: bigint;
  readonly highestRelevantIndex: bigint;
  readonly isConnected: boolean;
  isCompleteWithin(gap: bigint): boolean;
};

export const createSyncProgress = (data?: Partial<SyncProgressData>): SyncProgress => {
  const currentTransactionId = data?.currentTransactionId ?? 0;
  const highestTransactionId = data?.highestTransactionId ?? 0;
  return {
    appliedIndex: BigInt(currentTransactionId),
    highestRelevantWalletIndex: BigInt(highestTransactionId),
    highestIndex: BigInt(highestTransactionId),
    highestRelevantIndex: BigInt(highestTransactionId),
    isConnected: true,
    isCompleteWithin(gap: bigint): boolean {
      return this.highestRelevantWalletIndex - this.appliedIndex <= gap;
    },
  };
};

export type CoreWallet = Readonly<{
  publicKey: PublicKey;
  address: string;
  networkId: NetworkId.NetworkId;
  protocolVersion: ProtocolVersion.ProtocolVersion;
  utxos: HashSet.HashSet<Utxo>;
  pendingUtxos: HashSet.HashSet<Utxo>;
  progress: SyncProgress;
  txHistory: readonly TransactionHistoryEntry[];
}>;

export type TransactionHistoryEntry = {
  id: number;
  hash: string;
  protocolVersion: bigint;
  identifiers: readonly string[];
  transactionResult: {
    status: 'SUCCESS' | 'FAILURE' | 'PARTIAL_SUCCESS';
    segments: readonly { id: string; success: boolean }[];
  } | null;
};

export const CoreWallet = {
  empty(publicKey: PublicKey, address: string, networkId: NetworkId.NetworkId): CoreWallet {
    return {
      publicKey,
      address,
      networkId,
      protocolVersion: ProtocolVersion.MinSupportedVersion,
      utxos: HashSet.empty(),
      pendingUtxos: HashSet.empty(),
      progress: createSyncProgress(),
      txHistory: [],
    };
  },

  fromUnshieldedState(
    publicKey: PublicKey,
    address: string,
    networkId: NetworkId.NetworkId,
    stateData: UnshieldedStateData,
  ): CoreWallet {
    return {
      publicKey,
      address,
      networkId,
      protocolVersion: ProtocolVersion.MinSupportedVersion,
      utxos: stateData.utxos,
      pendingUtxos: stateData.pendingUtxos,
      progress: createSyncProgress(stateData.syncProgress),
      txHistory: [],
    };
  },

  addUtxo(wallet: CoreWallet, utxo: Utxo): CoreWallet {
    return { ...wallet, utxos: HashSet.add(wallet.utxos, utxo) };
  },

  removeUtxo(wallet: CoreWallet, utxo: Utxo): CoreWallet {
    return {
      ...wallet,
      utxos: HashSet.filter(wallet.utxos, (u) => u.intentHash !== utxo.intentHash || u.outputNo !== utxo.outputNo),
    };
  },

  addPendingUtxo(wallet: CoreWallet, utxo: Utxo): CoreWallet {
    return { ...wallet, pendingUtxos: HashSet.add(wallet.pendingUtxos, utxo) };
  },

  removePendingUtxo(wallet: CoreWallet, utxo: Utxo): CoreWallet {
    return {
      ...wallet,
      pendingUtxos: HashSet.filter(
        wallet.pendingUtxos,
        (u) => u.intentHash !== utxo.intentHash || u.outputNo !== utxo.outputNo,
      ),
    };
  },

  updateProgress(wallet: CoreWallet, progressData: Partial<SyncProgressData>): CoreWallet {
    return {
      ...wallet,
      progress: createSyncProgress({
        currentTransactionId: progressData.currentTransactionId ?? Number(wallet.progress.appliedIndex),
        highestTransactionId: progressData.highestTransactionId ?? Number(wallet.progress.highestIndex),
      }),
    };
  },

  addTransaction(wallet: CoreWallet, entry: TransactionHistoryEntry): CoreWallet {
    return { ...wallet, txHistory: [...wallet.txHistory, entry] };
  },

  getBalances(wallet: CoreWallet): Map<string, bigint> {
    return HashSet.reduce(wallet.utxos, new Map<string, bigint>(), (acc, utxo) => {
      acc.set(utxo.type, (acc.get(utxo.type) || 0n) + utxo.value);
      return acc;
    });
  },

  getAvailableCoins(wallet: CoreWallet): readonly Utxo[] {
    return HashSet.toValues(wallet.utxos);
  },

  getPendingCoins(wallet: CoreWallet): readonly Utxo[] {
    return HashSet.toValues(wallet.pendingUtxos);
  },

  getTotalCoins(wallet: CoreWallet): readonly Utxo[] {
    return HashSet.toValues(HashSet.union(wallet.utxos, wallet.pendingUtxos));
  },

  getSyncProgress(wallet: CoreWallet):
    | {
        applyGap: number;
        synced: boolean;
      }
    | undefined {
    return {
      applyGap: Number(wallet.progress.highestRelevantWalletIndex - wallet.progress.appliedIndex),
      synced: wallet.progress.isCompleteWithin(0n),
    };
  },
};
