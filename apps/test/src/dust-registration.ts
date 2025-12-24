import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { config, formatAmount, MNEMONIC_1, MNEMONIC_2, networkId } from './config';
import * as ledger from '@midnight-ntwrk/ledger-v6';
import * as rx from 'rxjs';

import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { WalletFacade, type CombinedTokenTransfer } from '@midnight-ntwrk/wallet-sdk-facade';
import { deriveWalletKeys } from './wallet';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';

const senderKeys = deriveWalletKeys(MNEMONIC_1, 0, 0);
const receiverKeys = deriveWalletKeys(MNEMONIC_2, 0, 0);

console.log('Setting up Sender wallet...');
const shieldedSender = ShieldedWallet(config).startWithShieldedSeed(senderKeys.shieldedSeed);
const unshieldedKeystoreSender = createKeystore(senderKeys.unshieldedExternalSeed, networkId);
const unshieldedSender = UnshieldedWallet({
  ...config,
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
}).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystoreSender));
const dustSender = DustWallet({
  ...config,
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
}).startWithSeed(senderKeys.dustSeed, ledger.LedgerParameters.initialParameters().dust);

console.log('Setting up Receiver wallet...');
const shieldedReceiver = ShieldedWallet(config).startWithShieldedSeed(receiverKeys.shieldedSeed);
const unshieldedKeystoreReceiver = createKeystore(receiverKeys.unshieldedExternalSeed, networkId);
const unshieldedReceiver = UnshieldedWallet({
  ...config,
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
}).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystoreReceiver));
const dustReceiver = DustWallet({
  ...config,
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
}).startWithSeed(receiverKeys.dustSeed, ledger.LedgerParameters.initialParameters().dust);

const senderFacade = new WalletFacade(shieldedSender, unshieldedSender, dustSender);
const receiverFacade = new WalletFacade(shieldedReceiver, unshieldedReceiver, dustReceiver);

console.log('Starting wallet facades...');
await Promise.all([
  senderFacade.start(senderKeys.shieldedSecretKeys, senderKeys.dustSecretKey),
  receiverFacade.start(receiverKeys.shieldedSecretKeys, receiverKeys.dustSecretKey),
]);

console.log('Waiting for wallets to sync...');
await Promise.all([
  rx.firstValueFrom(senderFacade.state().pipe(rx.filter((s) => s.isSynced))),
  rx.firstValueFrom(receiverFacade.state().pipe(rx.filter((s) => s.isSynced))),
]);

const senderState = await rx.firstValueFrom(senderFacade.state());
const receiverState = await rx.firstValueFrom(receiverFacade.state());

console.log('\n=== Sender Wallet ===');
console.log(`Unshielded NIGHT: ${formatAmount(senderState.unshielded.balances[ledger.nativeToken().raw] ?? 0n)}`);

console.log('\n=== Receiver Wallet ===');
const receiverUnshieldedAddress = receiverState.unshielded.address;
const receiverAddressStr = UnshieldedAddress.codec.encode(networkId, receiverUnshieldedAddress).asString();
console.log(`Address: ${receiverAddressStr}`);
console.log(`Unshielded NIGHT: ${formatAmount(receiverState.unshielded.balances[ledger.nativeToken().raw] ?? 0n)}`);
console.log(`Dust Balance: ${formatAmount(receiverState.dust.walletBalance(new Date()) ?? 0n)}`);

const transferAmount = 150_000_000_000_000n;
console.log(`\n=== Step 1: Transfer ${formatAmount(transferAmount)} NIGHT to Receiver ===`);

const tokenTransfer: CombinedTokenTransfer[] = [
  {
    type: 'unshielded',
    outputs: [
      {
        amount: transferAmount,
        receiverAddress: receiverAddressStr,
        type: ledger.unshieldedToken().raw,
      },
    ],
  },
];

const ttl = new Date(Date.now() + 30 * 60 * 1000);
const transferRecipe = await senderFacade.transferTransaction(
  senderKeys.shieldedSecretKeys,
  senderKeys.dustSecretKey,
  tokenTransfer,
  ttl,
);

const signedTransferTx = await senderFacade.signTransaction(transferRecipe.transaction, (payload) =>
  unshieldedKeystoreSender.signData(payload),
);

console.log('Finalizing transfer transaction...');
const finalizedTransferTx = await senderFacade.finalizeTransaction({
  ...transferRecipe,
  transaction: signedTransferTx,
});

console.log('Submitting transfer transaction...');
const transferTxHash = await senderFacade.submitTransaction(finalizedTransferTx);
console.log(`Transfer TX Hash: ${transferTxHash}`);

console.log('\nWaiting for receiver to receive NIGHT UTXOs...');
const receiverStateWithNight = await rx.firstValueFrom(
  receiverFacade
    .state()
    .pipe(
      rx.filter(
        (s) =>
          s.unshielded.availableCoins.length > 0 &&
          s.unshielded.availableCoins.some((coin) => coin.meta.registeredForDustGeneration === false),
      ),
    ),
);

const nightBalanceBeforeRegistration = receiverStateWithNight.unshielded.balances[ledger.nativeToken().raw] ?? 0n;
console.log(`Receiver NIGHT balance: ${formatAmount(nightBalanceBeforeRegistration)}`);

const nightUtxos = receiverStateWithNight.unshielded.availableCoins.filter(
  (coin) => coin.meta.registeredForDustGeneration === false && coin.utxo.type === ledger.nativeToken().raw,
);

console.log(`Found ${nightUtxos.length} NIGHT UTXOs not registered for dust generation`);

console.log('\n=== Step 2: Waiting for dust generation window ===');
console.log('Waiting 10 seconds for at least one block...');
await new Promise((resolve) => setTimeout(resolve, 10000));

console.log('\n=== Step 3: Registering NIGHT UTXOs for Dust Generation ===');
const dustRegistrationRecipe = await receiverFacade.registerNightUtxosForDustGeneration(
  nightUtxos,
  unshieldedKeystoreReceiver.getPublicKey(),
  (payload) => unshieldedKeystoreReceiver.signData(payload),
);

console.log('Finalizing dust registration transaction...');
const finalizedDustTx = await receiverFacade.finalizeTransaction(dustRegistrationRecipe);

console.log('Submitting dust registration transaction...');
const dustRegistrationTxHash = await receiverFacade.submitTransaction(finalizedDustTx);
console.log(`Dust Registration TX Hash: ${dustRegistrationTxHash}`);

console.log('\nWaiting for registration to complete...');
const receiverStateAfterRegistration = await rx.firstValueFrom(
  receiverFacade.state().pipe(
    rx.mergeMap(async (state) => {
      const txInHistory = await state.unshielded.transactionHistory.get(finalizedDustTx.transactionHash());
      return {
        state,
        txFound: txInHistory !== undefined,
      };
    }),
    rx.filter(({ state, txFound }) => txFound && state.isSynced && state.dust.availableCoins.length > 0),
    rx.map(({ state }) => state),
  ),
);

console.log('\n=== Dust Registration Completed ===');
console.log(`Dust Balance: ${formatAmount(receiverStateAfterRegistration.dust.walletBalance(new Date()) ?? 0n)}`);

const nightBalanceAfterRegistration =
  receiverStateAfterRegistration.unshielded.balances[ledger.nativeToken().raw] ?? 0n;
console.log(`NIGHT Balance (unchanged): ${formatAmount(nightBalanceAfterRegistration)}`);

await Promise.all([senderFacade.stop(), receiverFacade.stop()]);
console.log('\nWallets stopped.');
