import { Effect, Schema, ParseResult } from 'effect';

export const BigIntSchema = Schema.declare((input: unknown): input is bigint => typeof input === 'bigint').annotations({
  identifier: 'BigIntSchema',
});

export const SafeBigInt: Schema.Schema<bigint, string> = Schema.transformOrFail(Schema.String, BigIntSchema, {
  decode: (value) =>
    Effect.try({
      try: () => BigInt(value),
      catch: (err) => new ParseResult.Unexpected(err, 'Could not parse bigint'),
    }),
  encode: (value) => Effect.succeed(value.toString()),
});

export const UtxoSchema = Schema.Data(
  Schema.Struct({
    value: SafeBigInt,
    owner: Schema.String,
    tokenType: Schema.String,
    intentHash: Schema.String,
    outputIndex: Schema.Number,
    ctime: Schema.NullOr(Schema.Number),
    registeredForDustGeneration: Schema.Boolean,
  }),
);

export const UnshieldedTransactionSchema = Schema.Data(
  Schema.Struct({
    id: Schema.Number,
    hash: Schema.String,
    type: Schema.Literal('RegularTransaction', 'SystemTransaction'),
    protocolVersion: Schema.Number,
    identifiers: Schema.optional(Schema.Array(Schema.String)),
    block: Schema.Struct({
      timestamp: Schema.Number,
    }),
    fees: Schema.optional(
      Schema.Struct({
        paidFees: SafeBigInt,
        estimatedFees: SafeBigInt,
      }),
    ),
    transactionResult: Schema.optional(
      Schema.Struct({
        status: Schema.Literal('SUCCESS', 'FAILURE', 'PARTIAL_SUCCESS'),
        segments: Schema.NullOr(
          Schema.Array(
            Schema.Struct({
              id: Schema.Number,
              success: Schema.Boolean,
            }),
          ),
        ),
      }),
    ),
  }),
);

export type UnshieldedTransaction = Schema.Schema.Type<typeof UnshieldedTransactionSchema>;

export const UnshieldedUpdateSchema = Schema.Data(
  Schema.Struct({
    transaction: UnshieldedTransactionSchema,
    createdUtxos: Schema.Array(UtxoSchema),
    spentUtxos: Schema.Array(UtxoSchema),
  }),
);

export type UnshieldedUpdate = Schema.Schema.Type<typeof UnshieldedUpdateSchema>;

export const TransactionSchema = Schema.Struct({
  type: Schema.Literal('UnshieldedTransaction'),
  transaction: UnshieldedTransactionSchema,
  createdUtxos: Schema.Array(UtxoSchema),
  spentUtxos: Schema.Array(UtxoSchema),
});

export type TransactionUpdate = Schema.Schema.Type<typeof TransactionSchema>;

export const ProgressSchema = Schema.Struct({
  type: Schema.Literal('UnshieldedTransactionsProgress'),
  highestTransactionId: Schema.Number,
});
