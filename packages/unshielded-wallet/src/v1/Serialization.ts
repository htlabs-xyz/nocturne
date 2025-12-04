import { Either, pipe, Schema } from 'effect';
import { WalletError } from './WalletError.js';
import { CoreWallet } from './CoreWallet.js';
import { NetworkId, ProtocolVersion } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { UnshieldedState } from './UnshieldedState.js';

export type SerializationCapability<TWallet, TSerialized> = {
  serialize(wallet: TWallet): TSerialized;
  deserialize(data: TSerialized): Either.Either<TWallet, WalletError>;
};

export type DefaultSerializationConfiguration = {
  networkId: NetworkId.NetworkId;
};

export const makeDefaultV1SerializationCapability = (): SerializationCapability<CoreWallet, string> => {
  const UtxoWithMetaSchema = Schema.Struct({
    utxo: Schema.Struct({
      value: Schema.BigInt,
      owner: Schema.String,
      type: Schema.String,
      intentHash: Schema.String,
      outputNo: Schema.Number,
    }),
    meta: Schema.Struct({
      ctime: Schema.Date,
      registeredForDustGeneration: Schema.Boolean,
    }),
  });

  const SnapshotSchema = Schema.Struct({
    publicKeys: Schema.Struct({
      publicKey: Schema.String,
      addressHex: Schema.String,
      address: Schema.String,
    }),
    state: Schema.Struct({
      utxos: Schema.Array(UtxoWithMetaSchema),
      pendingUtxos: Schema.Array(UtxoWithMetaSchema),
    }),
    protocolVersion: Schema.BigInt,
    appliedId: Schema.optional(Schema.BigInt),
    networkId: Schema.String,
  });

  type Snapshot = Schema.Schema.Type<typeof SnapshotSchema>;
  return {
    serialize: (wallet) => {
      const buildSnapshot = (w: CoreWallet): Snapshot => ({
        publicKeys: w.publicKeys,
        state: {
          utxos: [...w.state.availableUtxos],
          pendingUtxos: [...w.state.pendingUtxos],
        },
        protocolVersion: w.protocolVersion,
        networkId: w.networkId,
        appliedId: w.progress?.appliedId,
      });

      return pipe(wallet, buildSnapshot, Schema.encodeSync(SnapshotSchema), JSON.stringify);
    },
    deserialize: (serialized): Either.Either<CoreWallet, WalletError> =>
      pipe(
        serialized,
        Schema.decodeUnknownEither(Schema.parseJson(SnapshotSchema)),
        Either.mapLeft((err) => WalletError.other(err)),
        Either.map((snapshot) => {
          return CoreWallet.restore(
            UnshieldedState.restore(snapshot.state.utxos, snapshot.state.pendingUtxos),
            snapshot.publicKeys,
            {
              highestTransactionId: snapshot.appliedId ?? 0n,
              appliedId: snapshot.appliedId ?? 0n,
            },
            ProtocolVersion.ProtocolVersion(snapshot.protocolVersion),
            snapshot.networkId,
          );
        }),
      ),
  };
};
