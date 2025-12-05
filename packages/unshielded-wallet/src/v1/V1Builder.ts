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
import { Effect, Either, Scope } from 'effect';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { Variant, VariantBuilder, WalletRuntimeError } from '@midnight-ntwrk/wallet-sdk-runtime/abstractions';
import { CoreWallet } from './CoreWallet.js';
import { RunningV1Variant, V1Tag } from './RunningV1Variant.js';
import {
  DefaultSyncConfiguration,
  DefaultSyncContext,
  makeEventsSyncService,
  makeEventsSyncCapability,
  SyncCapability,
  SyncService,
  UnshieldedUpdate,
} from './Sync.js';
import { TransactingCapability, makeDefaultTransactingCapability } from './Transacting.js';
import { CoinsAndBalancesCapability, makeDefaultCoinsAndBalancesCapability } from './CoinsAndBalances.js';
import { KeysCapability, makeDefaultKeysCapability } from './Keys.js';
import { SerializationCapability, SerializationError, makeDefaultSerializationCapability } from './Serialization.js';

export type BaseV1Configuration = {
  networkId: NetworkId.NetworkId;
};

export type DefaultV1Configuration = BaseV1Configuration & DefaultSyncConfiguration;

export type V1Variant<TSerialized> = Variant.Variant<typeof V1Tag, CoreWallet, null, RunningV1Variant<TSerialized>> & {
  deserializeState: (serialized: TSerialized) => Either.Either<CoreWallet, SerializationError>;
  coinsAndBalances: CoinsAndBalancesCapability<CoreWallet>;
  keys: KeysCapability<CoreWallet>;
  serialization: SerializationCapability<CoreWallet, null, TSerialized>;
};

export type DefaultV1Variant = V1Variant<string>;

export type DefaultV1Builder = V1Builder<
  DefaultV1Configuration,
  RunningV1Variant.Context<string>,
  string
>;

export class V1Builder<
  TConfig extends BaseV1Configuration = BaseV1Configuration,
  TContext extends Partial<RunningV1Variant.AnyContext> = object,
  TSerialized = never,
> implements VariantBuilder.VariantBuilder<V1Variant<TSerialized>, TConfig>
{
  readonly #buildState: V1Builder.PartialBuildState<TConfig, TContext, TSerialized>;

  constructor(buildState: V1Builder.PartialBuildState<TConfig, TContext, TSerialized> = {}) {
    this.#buildState = buildState;
  }

  withDefaults(): DefaultV1Builder {
    return this.withSyncDefaults()
      .withSerializationDefaults()
      .withTransactingDefaults()
      .withCoinsAndBalancesDefaults()
      .withKeysDefaults() as unknown as DefaultV1Builder;
  }

  withSyncDefaults(): V1Builder<
    TConfig & DefaultSyncConfiguration,
    TContext & DefaultSyncContext,
    TSerialized
  > {
    return this.withSync(makeEventsSyncService, makeEventsSyncCapability);
  }

  withSync<TSyncConfig, TSyncContext extends Partial<RunningV1Variant.AnyContext>>(
    syncService: (configuration: TSyncConfig, getContext: () => TSyncContext) => SyncService<CoreWallet, void, UnshieldedUpdate>,
    syncCapability: (configuration: TSyncConfig, getContext: () => TSyncContext) => SyncCapability<CoreWallet, UnshieldedUpdate>,
  ): V1Builder<TConfig & TSyncConfig, TContext & TSyncContext, TSerialized> {
    return new V1Builder<TConfig & TSyncConfig, TContext & TSyncContext, TSerialized>({
      ...this.#buildState,
      syncService,
      syncCapability,
    });
  }

  withSerializationDefaults(): V1Builder<TConfig, TContext, string> {
    return this.withSerialization(makeDefaultSerializationCapability);
  }

  withSerialization<TSerializationConfig, TSerializationContext extends Partial<RunningV1Variant.AnyContext>, TSerialized>(
    serializationCapability: (
      configuration: TSerializationConfig,
      getContext: () => TSerializationContext,
    ) => SerializationCapability<CoreWallet, null, TSerialized>,
  ): V1Builder<TConfig & TSerializationConfig, TContext & TSerializationContext, TSerialized> {
    return new V1Builder<TConfig & TSerializationConfig, TContext & TSerializationContext, TSerialized>({
      ...this.#buildState,
      serializationCapability,
    });
  }

  withTransactingDefaults(): V1Builder<TConfig, TContext, TSerialized> {
    return this.withTransacting(makeDefaultTransactingCapability);
  }

  withTransacting<TTransactingConfig, TTransactingContext extends Partial<RunningV1Variant.AnyContext>>(
    transactingCapability: (
      config: TTransactingConfig,
      getContext: () => TTransactingContext,
    ) => TransactingCapability<CoreWallet>,
  ): V1Builder<TConfig & TTransactingConfig, TContext & TTransactingContext, TSerialized> {
    return new V1Builder<TConfig & TTransactingConfig, TContext & TTransactingContext, TSerialized>({
      ...this.#buildState,
      transactingCapability,
    });
  }

  withCoinsAndBalancesDefaults(): V1Builder<TConfig, TContext, TSerialized> {
    return this.withCoinsAndBalances(makeDefaultCoinsAndBalancesCapability);
  }

  withCoinsAndBalances<TBalancesConfig, TBalancesContext extends Partial<RunningV1Variant.AnyContext>>(
    coinsAndBalancesCapability: (
      configuration: TBalancesConfig,
      getContext: () => TBalancesContext,
    ) => CoinsAndBalancesCapability<CoreWallet>,
  ): V1Builder<TConfig & TBalancesConfig, TContext & TBalancesContext, TSerialized> {
    return new V1Builder<TConfig & TBalancesConfig, TContext & TBalancesContext, TSerialized>({
      ...this.#buildState,
      coinsAndBalancesCapability,
    });
  }

  withKeysDefaults(): V1Builder<TConfig, TContext, TSerialized> {
    return this.withKeys(makeDefaultKeysCapability);
  }

  withKeys<TKeysConfig, TKeysContext extends Partial<RunningV1Variant.AnyContext>>(
    keysCapability: (configuration: TKeysConfig, getContext: () => TKeysContext) => KeysCapability<CoreWallet>,
  ): V1Builder<TConfig & TKeysConfig, TContext & TKeysContext, TSerialized> {
    return new V1Builder<TConfig & TKeysConfig, TContext & TKeysContext, TSerialized>({
      ...this.#buildState,
      keysCapability,
    });
  }

  build(
    this: V1Builder<TConfig, RunningV1Variant.Context<TSerialized>, TSerialized>,
    configuration: TConfig,
  ): V1Variant<TSerialized> {
    const v1Context = this.#buildContextFromBuildState(configuration);

    return {
      __polyTag__: V1Tag,
      coinsAndBalances: v1Context.coinsAndBalancesCapability,
      keys: v1Context.keysCapability,
      serialization: v1Context.serializationCapability,
      start(
        context: Variant.VariantContext<CoreWallet>,
      ): Effect.Effect<RunningV1Variant<TSerialized>, WalletRuntimeError, Scope.Scope> {
        return Effect.gen(function* () {
          const scope = yield* Scope.Scope;
          return new RunningV1Variant(scope, context, v1Context);
        });
      },
      migrateState(_previousState) {
        return Effect.succeed(CoreWallet.empty({ address: { hexString: '' } } as any, '', configuration.networkId));
      },
      deserializeState: (serialized: TSerialized): Either.Either<CoreWallet, SerializationError> => {
        return v1Context.serializationCapability.deserialize(null, serialized);
      },
    };
  }

  #buildContextFromBuildState(
    this: V1Builder<TConfig, RunningV1Variant.Context<TSerialized>, TSerialized>,
    configuration: TConfig,
  ): RunningV1Variant.Context<TSerialized> {
    if (!isBuildStateFull(this.#buildState)) {
      throw new Error('Not all components are configured in V1 Builder');
    }

    const {
      syncCapability,
      syncService,
      transactingCapability,
      serializationCapability,
      coinsAndBalancesCapability,
      keysCapability,
    } = this.#buildState;

    const getContext = (): RunningV1Variant.Context<TSerialized> => context;

    const context = {
      serializationCapability: serializationCapability(configuration, getContext),
      syncCapability: syncCapability(configuration, getContext),
      syncService: syncService(configuration, getContext),
      transactingCapability: transactingCapability(configuration, getContext),
      coinsAndBalancesCapability: coinsAndBalancesCapability(configuration, getContext),
      keysCapability: keysCapability(configuration, getContext),
    };

    return context;
  }
}

declare namespace V1Builder {
  type HasSync<TConfig, TContext> = {
    readonly syncService: (configuration: TConfig, getContext: () => TContext) => SyncService<CoreWallet, void, UnshieldedUpdate>;
    readonly syncCapability: (configuration: TConfig, getContext: () => TContext) => SyncCapability<CoreWallet, UnshieldedUpdate>;
  };

  type HasTransacting<TConfig, TContext> = {
    readonly transactingCapability: (configuration: TConfig, getContext: () => TContext) => TransactingCapability<CoreWallet>;
  };

  type HasSerialization<TConfig, TContext, TSerialized> = {
    readonly serializationCapability: (
      configuration: TConfig,
      getContext: () => TContext,
    ) => SerializationCapability<CoreWallet, null, TSerialized>;
  };

  type HasCoinsAndBalances<TConfig, TContext> = {
    readonly coinsAndBalancesCapability: (
      configuration: TConfig,
      getContext: () => TContext,
    ) => CoinsAndBalancesCapability<CoreWallet>;
  };

  type HasKeys<TConfig, TContext> = {
    readonly keysCapability: (configuration: TConfig, getContext: () => TContext) => KeysCapability<CoreWallet>;
  };

  type FullBuildState<TConfig, TContext, TSerialized> = HasSync<TConfig, TContext> &
    HasSerialization<TConfig, TContext, TSerialized> &
    HasTransacting<TConfig, TContext> &
    HasCoinsAndBalances<TConfig, TContext> &
    HasKeys<TConfig, TContext>;

  type PartialBuildState<TConfig = object, TContext = object, TSerialized = never> = {
    [K in keyof FullBuildState<never, never, never>]?: FullBuildState<TConfig, TContext, TSerialized>[K] | undefined;
  };
}

const isBuildStateFull = <TConfig, TContext, TSerialized>(
  buildState: V1Builder.PartialBuildState<TConfig, TContext, TSerialized>,
): buildState is V1Builder.FullBuildState<TConfig, TContext, TSerialized> => {
  const allBuildStateKeys = [
    'syncService',
    'syncCapability',
    'transactingCapability',
    'serializationCapability',
    'coinsAndBalancesCapability',
    'keysCapability',
  ] as const;
  return allBuildStateKeys.every((key) => typeof buildState[key] === 'function');
};
