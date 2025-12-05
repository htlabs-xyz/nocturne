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
import { Console, Duration, Effect, pipe, Schedule, Scope, Sink, Stream, SubscriptionRef } from 'effect';
import { ProtocolVersion } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { WalletRuntimeError, Variant, StateChange, VersionChangeType } from '@midnight-ntwrk/wallet-sdk-runtime/abstractions';
import { EitherOps } from '@midnight-ntwrk/wallet-sdk-utilities';
import { CoreWallet } from './CoreWallet.js';
import { SyncCapability, SyncService, SyncError, UnshieldedUpdate } from './Sync.js';
import { TransactingCapability, TokenTransfer } from './Transacting.js';
import { CoinsAndBalancesCapability } from './CoinsAndBalances.js';
import { KeysCapability } from './Keys.js';
import { SerializationCapability } from './Serialization.js';
import * as ledger from '@midnight-ntwrk/ledger-v6';

const progress = (state: CoreWallet): StateChange.StateChange<CoreWallet>[] => {
  const appliedIndex = state.progress.appliedIndex;
  const highestRelevantWalletIndex = state.progress.highestRelevantWalletIndex;
  const highestIndex = state.progress.highestIndex;
  const highestRelevantIndex = state.progress.highestRelevantIndex;

  const sourceGap = highestIndex - highestRelevantIndex;
  const applyGap = highestRelevantWalletIndex - appliedIndex;

  return [StateChange.ProgressUpdate({ sourceGap, applyGap })];
};

const protocolVersionChange = (previous: CoreWallet, current: CoreWallet): StateChange.StateChange<CoreWallet>[] => {
  return previous.protocolVersion !== current.protocolVersion
    ? [
        StateChange.VersionChange({
          change: VersionChangeType.Version({
            version: ProtocolVersion.ProtocolVersion(current.protocolVersion),
          }),
        }),
      ]
    : [];
};

export declare namespace RunningV1Variant {
  export type Context<TSerialized> = {
    serializationCapability: SerializationCapability<CoreWallet, null, TSerialized>;
    syncService: SyncService<CoreWallet, void, UnshieldedUpdate>;
    syncCapability: SyncCapability<CoreWallet, UnshieldedUpdate>;
    transactingCapability: TransactingCapability<CoreWallet>;
    coinsAndBalancesCapability: CoinsAndBalancesCapability<CoreWallet>;
    keysCapability: KeysCapability<CoreWallet>;
  };
  export type AnyContext = Context<string>;
}

export const V1Tag: unique symbol = Symbol('UnshieldedV1');
export type V1Tag = typeof V1Tag;

export class RunningV1Variant<TSerialized>
  implements Variant.RunningVariant<typeof V1Tag, CoreWallet>
{
  readonly __polyTag__: typeof V1Tag = V1Tag;
  readonly #scope: Scope.Scope;
  readonly #context: Variant.VariantContext<CoreWallet>;
  readonly #v1Context: RunningV1Variant.Context<TSerialized>;

  readonly state: Stream.Stream<StateChange.StateChange<CoreWallet>, WalletRuntimeError>;

  constructor(
    scope: Scope.Scope,
    context: Variant.VariantContext<CoreWallet>,
    v1Context: RunningV1Variant.Context<TSerialized>,
  ) {
    this.#scope = scope;
    this.#context = context;
    this.#v1Context = v1Context;
    this.state = Stream.fromEffect(context.stateRef.get).pipe(
      Stream.flatMap((initialState) =>
        context.stateRef.changes.pipe(
          Stream.mapAccum(initialState, (previous: CoreWallet, current: CoreWallet) => {
            return [current, [previous, current]] as const;
          }),
        ),
      ),
      Stream.mapConcat(([previous, current]: readonly [CoreWallet, CoreWallet]): StateChange.StateChange<CoreWallet>[] => {
        return [StateChange.State({ state: current }), ...progress(current), ...protocolVersionChange(previous, current)];
      }),
    );
  }

  startSyncInBackground(): Effect.Effect<void> {
    return this.startSync().pipe(
      Stream.runScoped(Sink.drain),
      Effect.forkScoped,
      Effect.provideService(Scope.Scope, this.#scope),
    );
  }

  startSync(): Stream.Stream<void, SyncError, Scope.Scope> {
    return pipe(
      SubscriptionRef.get(this.#context.stateRef),
      Stream.fromEffect,
      Stream.flatMap((state) => this.#v1Context.syncService.updates(state, undefined)),
      Stream.mapEffect((update) => {
        return SubscriptionRef.updateEffect(this.#context.stateRef, (state) =>
          Effect.try({
            try: () => this.#v1Context.syncCapability.applyUpdate(state, update),
            catch: (err) => new SyncError({ error: err }),
          }),
        );
      }),
      Stream.tapError((error) => Console.error(error)),
      Stream.retry(
        pipe(
          Schedule.exponential(Duration.seconds(1), 2),
          Schedule.map((delay) => {
            const maxDelay = Duration.minutes(2);
            const jitter = Duration.millis(Math.floor(Math.random() * 1000));
            const delayWithJitter = Duration.toMillis(delay) + Duration.toMillis(jitter);
            return Duration.millis(Math.min(delayWithJitter, Duration.toMillis(maxDelay)));
          }),
        ),
      ),
    );
  }

  transferTransaction(
    outputs: ReadonlyArray<TokenTransfer>,
    ttl: Date,
  ): Effect.Effect<ledger.UnprovenTransaction, SyncError> {
    return SubscriptionRef.modifyEffect(this.#context.stateRef, (state) => {
      return pipe(
        this.#v1Context.transactingCapability.createTransfer(state, [...outputs], ttl, state.networkId),
        EitherOps.toEffect,
        Effect.map(({ transaction, newState }) => [transaction, newState] as const),
        Effect.mapError((err) => new SyncError({ error: err })),
      );
    });
  }

  initSwap(
    desiredInputs: Record<string, bigint>,
    desiredOutputs: ReadonlyArray<TokenTransfer>,
    ttl: Date,
  ): Effect.Effect<ledger.UnprovenTransaction, SyncError> {
    return SubscriptionRef.modifyEffect(this.#context.stateRef, (state) => {
      return pipe(
        this.#v1Context.transactingCapability.createSwap(state, desiredInputs, [...desiredOutputs], ttl, state.networkId),
        EitherOps.toEffect,
        Effect.map(({ transaction, newState }) => [transaction, newState] as const),
        Effect.mapError((err) => new SyncError({ error: err })),
      );
    });
  }

  balanceTransaction(
    tx: ledger.Transaction<ledger.SignatureEnabled, ledger.Proofish, ledger.Bindingish>,
  ): Effect.Effect<ledger.Transaction<ledger.SignatureEnabled, ledger.Proofish, ledger.Bindingish>, SyncError> {
    return SubscriptionRef.modifyEffect(this.#context.stateRef, (state) => {
      return pipe(
        this.#v1Context.transactingCapability.balanceTransaction(state, tx, state.networkId),
        EitherOps.toEffect,
        Effect.map(({ transaction, newState }) => [transaction, newState] as const),
        Effect.mapError((err) => new SyncError({ error: err })),
      );
    });
  }

  serializeState(state: CoreWallet): TSerialized {
    return this.#v1Context.serializationCapability.serialize(state);
  }
}
