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
import { CoreWallet, SyncProgress } from './CoreWallet.js';
import { Utxo } from '@midnight-ntwrk/wallet-sdk-unshielded-state';

export interface CoinsAndBalancesCapability<TState> {
  getBalances(state: TState): Map<string, bigint>;
  getAvailableCoins(state: TState): readonly Utxo[];
  getPendingCoins(state: TState): readonly Utxo[];
  getTotalCoins(state: TState): readonly Utxo[];
  getSyncProgress(state: TState):
    | {
        applyGap: number;
        synced: boolean;
      }
    | undefined;
  getProgress(state: TState): SyncProgress;
}

export const makeDefaultCoinsAndBalancesCapability = (
  _configuration: object,
  _getContext: () => object,
): CoinsAndBalancesCapability<CoreWallet> => ({
  getBalances(state: CoreWallet): Map<string, bigint> {
    return CoreWallet.getBalances(state);
  },

  getAvailableCoins(state: CoreWallet): readonly Utxo[] {
    return CoreWallet.getAvailableCoins(state);
  },

  getPendingCoins(state: CoreWallet): readonly Utxo[] {
    return CoreWallet.getPendingCoins(state);
  },

  getTotalCoins(state: CoreWallet): readonly Utxo[] {
    return CoreWallet.getTotalCoins(state);
  },

  getSyncProgress(state: CoreWallet) {
    return CoreWallet.getSyncProgress(state);
  },

  getProgress(state: CoreWallet): SyncProgress {
    return state.progress;
  },
});
