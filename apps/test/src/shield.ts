import * as ledger from '@midnight-ntwrk/ledger-v6';
import { ShieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { CustomShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import {
  Proving,
  Simulator,
  Submission,
  Sync,
  Transacting,
  TransactionHistory,
  V1Builder,
} from '@midnight-ntwrk/wallet-sdk-shielded/v1';
import { Effect, pipe } from 'effect';
import * as rx from 'rxjs';
import { NETWORK_CONFIG } from './config';

const shieldedTokenType = (ledger.shieldedToken() as { tag: 'shielded'; raw: string }).raw;

export async function runShieldedWalletTest() {
  console.log('=== Shielded Wallet Test ===\n');
  console.log(`Network: ${NETWORK_CONFIG.networkId}\n`);

  return Effect.gen(function* () {
    const senderSeed = Buffer.alloc(32, 0);
    const receiverSeed = Buffer.alloc(32, 1);

    const senderKeys = ledger.ZswapSecretKeys.fromSeed(senderSeed);
    const receiverKeys = ledger.ZswapSecretKeys.fromSeed(receiverSeed);

    const genesisMints = [
      {
        amount: 10_000_000n,
        type: shieldedTokenType,
        recipient: senderKeys,
      },
    ] as const;

    console.log('Initializing simulator...');
    const simulator = yield* Simulator.Simulator.init(genesisMints);
    console.log('Simulator initialized with genesis mint of 10,000,000 tokens\n');

    const Wallet = CustomShieldedWallet(
      {
        simulator,
        networkId: NETWORK_CONFIG.networkId as NetworkId.NetworkId,
      },
      new V1Builder()
        .withTransactionType<ledger.ProofErasedTransaction>()
        .withProving(Proving.makeSimulatorProvingService)
        .withCoinSelectionDefaults()
        .withTransacting(Transacting.makeSimulatorTransactingCapability)
        .withTransactionHistory(TransactionHistory.makeSimulatorTransactionHistoryCapability)
        .withSync(Sync.makeSimulatorSyncService, Sync.makeSimulatorSyncCapability)
        .withCoinsAndBalancesDefaults()
        .withKeysDefaults()
        .withSubmission(Submission.makeSimulatorSubmissionService())
        .withSerializationDefaults(),
    );

    console.log('Creating sender wallet...');
    const senderWallet = Wallet.startWithSecretKeys(senderKeys);
    const senderAddress = yield* Effect.promise(() => senderWallet.getAddress());
    console.log(
      `Sender address: ${ShieldedAddress.codec.encode(NETWORK_CONFIG.networkId as NetworkId.NetworkId, senderAddress).asString()}\n`,
    );

    console.log('Creating receiver wallet...');
    const receiverWallet = Wallet.startWithSecretKeys(receiverKeys);
    const receiverAddress = yield* Effect.promise(() => receiverWallet.getAddress());
    console.log(
      `Receiver address: ${ShieldedAddress.codec.encode(NETWORK_CONFIG.networkId as NetworkId.NetworkId, receiverAddress).asString()}\n`,
    );

    console.log('Starting wallets sync...');
    yield* Effect.promise(() => senderWallet.start(senderKeys));
    yield* Effect.promise(() => receiverWallet.start(receiverKeys));
    console.log('Wallets sync started\n');

    console.log('Waiting for sender to receive genesis coins...');
    yield* Effect.promise(() => {
      return pipe(
        senderWallet.state,
        rx.filter((s) => s.availableCoins.length > 0),
        rx.firstValueFrom,
      );
    });

    const senderState = yield* Effect.promise(() => rx.firstValueFrom(senderWallet.state));
    console.log(`Sender available coins: ${senderState.availableCoins.length}`);
    console.log(`Sender balance: ${senderState.balances[shieldedTokenType] ?? 0n}\n`);

    console.log('Creating transfer transaction (42 tokens to receiver)...');
    const recipe = yield* Effect.promise(() =>
      senderWallet.transferTransaction(senderKeys, [
        {
          type: shieldedTokenType,
          amount: 42n,
          receiverAddress: ShieldedAddress.codec
            .encode(NETWORK_CONFIG.networkId as NetworkId.NetworkId, receiverAddress)
            .asString(),
        },
      ]),
    );
    console.log('Transaction recipe created\n');

    console.log('Finalizing transaction...');
    const tx = yield* Effect.promise(() => senderWallet.finalizeTransaction(recipe));
    console.log('Transaction finalized\n');

    console.log('Submitting transaction...');
    const submitResult = yield* Effect.promise(() => senderWallet.submitTransaction(tx));
    console.log(`Transaction submitted, block height: ${submitResult.blockHeight}\n`);

    console.log('Waiting for receiver to receive tokens...');
    const finalBalance = yield* Effect.promise(() =>
      pipe(
        receiverWallet.state,
        rx.filter((state) => state.availableCoins.length > 0),
        rx.map((state) => state.balances[shieldedTokenType] ?? 0n),
        (a) => rx.firstValueFrom(a),
      ),
    );

    console.log(`\n=== Results ===`);
    console.log(`Receiver final balance: ${finalBalance}`);
    console.log(`Expected: 42`);
    console.log(`Test ${finalBalance === 42n ? 'PASSED ✅' : 'FAILED ❌'}`);

    return finalBalance === 42n;
  }).pipe(Effect.scoped, Effect.runPromise);
}

if (import.meta.main) {
  runShieldedWalletTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed with error:', error);
      process.exit(1);
    });
}
