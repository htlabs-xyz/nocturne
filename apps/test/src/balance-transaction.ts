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
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { deriveWalletKeys } from './wallet';

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
await rx.firstValueFrom(senderFacade.state().pipe(rx.filter((s) => s.isSynced)));

const senderState = await rx.firstValueFrom(senderFacade.state());
const receiverShieldedState = await rx.firstValueFrom(receiverFacade.shielded.state);

console.log('\n=== Sender Wallet ===');
console.log(`Shielded NIGHT: ${formatAmount(senderState.shielded.balances[ledger.shieldedToken().raw] ?? 0n)}`);
console.log(`Unshielded NIGHT: ${formatAmount(senderState.unshielded.balances[ledger.nativeToken().raw] ?? 0n)}`);

const transferAmount = 1_000_000n;

console.log(`\n=== Demo 1: Balance Arbitrary Shielded Transaction ===`);
console.log(`Creating shielded coin transfer of ${formatAmount(transferAmount)}...`);

const shieldedTransfer = {
  type: ledger.shieldedToken().raw,
  amount: transferAmount,
};

const coin = ledger.createShieldedCoinInfo(shieldedTransfer.type, shieldedTransfer.amount);

const output = ledger.ZswapOutput.new(
  coin,
  0,
  receiverShieldedState.address.coinPublicKey.toHexString(),
  receiverShieldedState.address.encryptionPublicKey.toHexString(),
);

const outputOffer = ledger.ZswapOffer.fromOutput(output, shieldedTransfer.type, shieldedTransfer.amount);

const arbitraryShieldedTx = ledger.Transaction.fromParts(networkId, outputOffer);

console.log('Proving arbitrary shielded transaction...');
const provenArbitraryTx = await senderFacade.shielded.finalizeTransaction({
  type: 'TransactionToProve',
  transaction: arbitraryShieldedTx,
});

console.log('Balancing shielded transaction...');
const balancedShieldedTx = await senderFacade.balanceTransaction(
  senderKeys.shieldedSecretKeys,
  senderKeys.dustSecretKey,
  provenArbitraryTx,
  new Date(Date.now() + 30 * 60 * 1000),
);

console.log('Finalizing balanced shielded transaction...');
const finalizedShieldedTx = await senderFacade.finalizeTransaction(balancedShieldedTx);

console.log('Submitting shielded transaction...');
const shieldedTxHash = await senderFacade.submitTransaction(finalizedShieldedTx);
console.log(`Shielded TX Hash: ${shieldedTxHash}`);

console.log('\nWaiting for receiver to receive shielded coins...');
await rx.firstValueFrom(
  receiverFacade.state().pipe(rx.filter((s) => s.shielded.availableCoins.some((c) => c.coin.value === transferAmount))),
);
console.log('Receiver received shielded coins ✓');

console.log(`\n=== Demo 2: Balance Arbitrary Unshielded Transaction ===`);
console.log(`Creating unshielded output transfer of ${formatAmount(transferAmount)}...`);

const unshieldedOutputs = [
  {
    type: ledger.unshieldedToken().raw,
    value: transferAmount,
    owner: unshieldedKeystoreReceiver.getAddress(),
  },
];

const intent = ledger.Intent.new(new Date(Date.now() + 30 * 60 * 1000));
intent.guaranteedUnshieldedOffer = ledger.UnshieldedOffer.new([], unshieldedOutputs, []);

const arbitraryUnshieldedTx = ledger.Transaction.fromParts(networkId, undefined, undefined, intent);

console.log('Balancing unshielded transaction...');
const balancedUnshieldedRecipe = await senderFacade.balanceTransaction(
  senderKeys.shieldedSecretKeys,
  senderKeys.dustSecretKey,
  arbitraryUnshieldedTx,
  new Date(Date.now() + 30 * 60 * 1000),
);

if (balancedUnshieldedRecipe.type !== 'TransactionToProve') {
  throw new Error('Expected a transaction to prove');
}

console.log('Signing unshielded transaction...');
const signedUnshieldedTx = await senderFacade.signTransaction(balancedUnshieldedRecipe.transaction, (payload) =>
  unshieldedKeystoreSender.signData(payload),
);

console.log('Finalizing balanced unshielded transaction...');
const finalizedUnshieldedTx = await senderFacade.finalizeTransaction({
  ...balancedUnshieldedRecipe,
  transaction: signedUnshieldedTx,
});

console.log('Submitting unshielded transaction...');
const unshieldedTxHash = await senderFacade.submitTransaction(finalizedUnshieldedTx);
console.log(`Unshielded TX Hash: ${unshieldedTxHash}`);

console.log('\nWaiting for receiver to receive unshielded coins...');
await rx.firstValueFrom(
  receiverFacade
    .state()
    .pipe(rx.filter((s) => s.unshielded.availableCoins.some((c) => c.utxo.value === transferAmount))),
);
console.log('Receiver received unshielded coins ✓');

const senderStateAfter = await rx.firstValueFrom(senderFacade.state());
const receiverStateAfter = await rx.firstValueFrom(receiverFacade.state());

console.log('\n=== Final Balances ===');
console.log('Sender:');
console.log(`  Shielded NIGHT: ${formatAmount(senderStateAfter.shielded.balances[ledger.shieldedToken().raw] ?? 0n)}`);
console.log(
  `  Unshielded NIGHT: ${formatAmount(senderStateAfter.unshielded.balances[ledger.nativeToken().raw] ?? 0n)}`,
);
console.log('Receiver:');
console.log(
  `  Shielded NIGHT: ${formatAmount(receiverStateAfter.shielded.balances[ledger.shieldedToken().raw] ?? 0n)}`,
);
console.log(
  `  Unshielded NIGHT: ${formatAmount(receiverStateAfter.unshielded.balances[ledger.nativeToken().raw] ?? 0n)}`,
);

await Promise.all([senderFacade.stop(), receiverFacade.stop()]);
console.log('\nWallets stopped.');
