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
import { Data, Effect, Either, HashSet } from 'effect';
import { CoreWallet } from './CoreWallet.js';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { getBalanceRecipe, Imbalances } from '@midnight-ntwrk/wallet-sdk-capabilities';
import { Utxo } from '@midnight-ntwrk/wallet-sdk-unshielded-state';
import * as ledger from '@midnight-ntwrk/ledger-v6';

export class TransactingError extends Data.TaggedError('TransactingError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type TokenTransfer = {
  readonly amount: bigint;
  readonly type: string;
  readonly receiverAddress: string;
};

export interface TransactingCapability<TState> {
  createTransfer(
    state: TState,
    outputs: TokenTransfer[],
    ttl: Date,
    networkId: NetworkId.NetworkId,
  ): Either.Either<{ transaction: ledger.UnprovenTransaction; newState: TState }, TransactingError>;

  createSwap(
    state: TState,
    desiredInputs: Record<string, bigint>,
    desiredOutputs: TokenTransfer[],
    ttl: Date,
    networkId: NetworkId.NetworkId,
  ): Either.Either<{ transaction: ledger.UnprovenTransaction; newState: TState }, TransactingError>;

  balanceTransaction(
    state: TState,
    transaction: ledger.Transaction<ledger.SignatureEnabled, ledger.Proofish, ledger.Bindingish>,
    networkId: NetworkId.NetworkId,
  ): Either.Either<
    { transaction: ledger.Transaction<ledger.SignatureEnabled, ledger.Proofish, ledger.Bindingish>; newState: TState },
    TransactingError
  >;

  revert(state: TState, transaction: ledger.UnprovenTransaction): Either.Either<TState, TransactingError>;
}

export const makeDefaultTransactingCapability = (
  _configuration: object,
  _getContext: () => object,
): TransactingCapability<CoreWallet> => {
  const GUARANTEED_SEGMENT = 0;

  const ledgerTry = <A>(fn: () => A): Either.Either<A, TransactingError> => {
    return Either.try({
      try: fn,
      catch: (error) => {
        const message = error instanceof Error ? error.message : `${error?.toString()}`;
        return new TransactingError({ message: `Error from ledger: ${message}`, cause: error });
      },
    });
  };

  return {
    createTransfer(
      state: CoreWallet,
      outputs: TokenTransfer[],
      ttl: Date,
      networkId: NetworkId.NetworkId,
    ): Either.Either<{ transaction: ledger.UnprovenTransaction; newState: CoreWallet }, TransactingError> {
      const isValid = outputs.every((output) => output.amount > 0n);
      if (!isValid) {
        return Either.left(new TransactingError({ message: 'The amount needs to be positive' }));
      }

      const ledgerOutputs = outputs.map((output) => {
        const decoded = UnshieldedAddress.codec.decode(networkId, MidnightBech32m.parse(output.receiverAddress));
        return {
          value: output.amount,
          owner: decoded.data.toString('hex'),
          type: output.type,
        };
      });

      const availableCoins = CoreWallet.getAvailableCoins(state);

      const outputsImbalances = outputs.reduce(
        (acc, output) => {
          acc[output.type] = (acc[output.type] || 0n) - output.amount;
          return acc;
        },
        {} as Record<string, bigint>,
      );

      const balanceResult = Either.try({
        try: () =>
          getBalanceRecipe<Utxo, ledger.UtxoOutput>({
            coins: availableCoins,
            initialImbalances: Imbalances.fromEntries(Object.entries(outputsImbalances)),
            feeTokenType: '',
            transactionCostModel: {
              inputFeeOverhead: 0n,
              outputFeeOverhead: 0n,
            },
            createOutput: (coin) => ({
              ...coin,
              owner: state.publicKey.address.hexString,
            }),
            isCoinEqual: (a, b) => a.intentHash === b.intentHash && a.outputNo === b.outputNo,
          }),
        catch: (error) => {
          const message = error instanceof Error ? error.message : error?.toString() || '';
          return new TransactingError({ message });
        },
      });

      if (Either.isLeft(balanceResult)) {
        return balanceResult;
      }

      const { inputs, outputs: changeOutputs } = balanceResult.right;

      let newState = state;
      for (const input of inputs) {
        newState = {
          ...newState,
          utxos: HashSet.filter(
            newState.utxos,
            (u) => u.intentHash !== input.intentHash || u.outputNo !== input.outputNo,
          ),
          pendingUtxos: HashSet.add(newState.pendingUtxos, input),
        };
      }

      const ledgerInputs = inputs.map((input) => ({
        ...input,
        owner: state.publicKey.publicKey,
      }));

      const transactionResult = ledgerTry(() => {
        const offer = ledger.UnshieldedOffer.new(ledgerInputs, [...changeOutputs, ...ledgerOutputs], []);
        const intent = ledger.Intent.new(ttl);
        intent.guaranteedUnshieldedOffer = offer;
        return ledger.Transaction.fromParts(networkId, undefined, undefined, intent);
      });

      if (Either.isLeft(transactionResult)) {
        return transactionResult;
      }

      return Either.right({
        transaction: transactionResult.right,
        newState,
      });
    },

    createSwap(
      state: CoreWallet,
      desiredInputs: Record<string, bigint>,
      desiredOutputs: TokenTransfer[],
      ttl: Date,
      networkId: NetworkId.NetworkId,
    ): Either.Either<{ transaction: ledger.UnprovenTransaction; newState: CoreWallet }, TransactingError> {
      const outputsValid = desiredOutputs.every((output) => output.amount > 0n);
      if (!outputsValid) {
        return Either.left(new TransactingError({ message: 'The amount needs to be positive' }));
      }

      const inputsValid = Object.entries(desiredInputs).every(([, amount]) => amount > 0n);
      if (!inputsValid) {
        return Either.left(new TransactingError({ message: 'The input amounts need to be positive' }));
      }

      const ledgerOutputs = desiredOutputs.map((output) => {
        const decoded = UnshieldedAddress.codec.decode(networkId, MidnightBech32m.parse(output.receiverAddress));
        return {
          value: output.amount,
          owner: decoded.data.toString('hex'),
          type: output.type,
        };
      });

      const targetImbalances = Imbalances.fromEntries(Object.entries(desiredInputs));
      const availableCoins = CoreWallet.getAvailableCoins(state);

      const balanceResult = Either.try({
        try: () =>
          getBalanceRecipe<Utxo, ledger.UtxoOutput>({
            coins: availableCoins,
            initialImbalances: Imbalances.empty(),
            feeTokenType: '',
            transactionCostModel: {
              inputFeeOverhead: 0n,
              outputFeeOverhead: 0n,
            },
            createOutput: (coin) => ({
              ...coin,
              owner: state.publicKey.address.hexString,
            }),
            isCoinEqual: (a, b) => a.intentHash === b.intentHash && a.outputNo === b.outputNo,
            targetImbalances,
          }),
        catch: (error) => {
          const message = error instanceof Error ? error.message : error?.toString() || '';
          return new TransactingError({ message });
        },
      });

      if (Either.isLeft(balanceResult)) {
        return balanceResult;
      }

      const { inputs, outputs: changeOutputs } = balanceResult.right;

      let newState = state;
      for (const input of inputs) {
        newState = {
          ...newState,
          utxos: HashSet.filter(
            newState.utxos,
            (u) => u.intentHash !== input.intentHash || u.outputNo !== input.outputNo,
          ),
          pendingUtxos: HashSet.add(newState.pendingUtxos, input),
        };
      }

      const ledgerInputs = inputs.map((input) => ({
        ...input,
        owner: state.publicKey.publicKey,
      }));

      const transactionResult = ledgerTry(() => {
        const offer = ledger.UnshieldedOffer.new(ledgerInputs, [...changeOutputs, ...ledgerOutputs], []);
        const intent = ledger.Intent.new(ttl);
        intent.guaranteedUnshieldedOffer = offer;
        return ledger.Transaction.fromParts(networkId, undefined, undefined, intent);
      });

      if (Either.isLeft(transactionResult)) {
        return transactionResult;
      }

      return Either.right({
        transaction: transactionResult.right,
        newState,
      });
    },

    balanceTransaction(
      state: CoreWallet,
      transaction: ledger.Transaction<ledger.SignatureEnabled, ledger.Proofish, ledger.Bindingish>,
      _networkId: NetworkId.NetworkId,
    ): Either.Either<
      {
        transaction: ledger.Transaction<ledger.SignatureEnabled, ledger.Proofish, ledger.Bindingish>;
        newState: CoreWallet;
      },
      TransactingError
    > {
      return Either.right({ transaction, newState: state });
    },

    revert(state: CoreWallet, _transaction: ledger.UnprovenTransaction): Either.Either<CoreWallet, TransactingError> {
      return Either.right(state);
    },
  };
};
