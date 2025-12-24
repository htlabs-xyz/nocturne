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
import { WalletFacade, type CombinedSwapInputs, type CombinedSwapOutputs } from '@midnight-ntwrk/wallet-sdk-facade';
import { deriveWalletKeys } from './wallet';
import { ShieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';

const walletAKeys = deriveWalletKeys(MNEMONIC_1, 0, 0);
const walletBKeys = deriveWalletKeys(MNEMONIC_2, 0, 0);

console.log('Setting up Wallet A (initiator)...');
const shieldedWalletA = ShieldedWallet(config).startWithShieldedSeed(walletAKeys.shieldedSeed);
const unshieldedKeystoreA = createKeystore(walletAKeys.unshieldedExternalSeed, networkId);
const unshieldedWalletA = UnshieldedWallet({
  ...config,
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
}).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystoreA));
const dustWalletA = DustWallet({
  ...config,
  costParameters: {
    additionalFeeOverhead: 900_000_000_000_000n,
    feeBlocksMargin: 5,
  },
}).startWithSeed(walletAKeys.dustSeed, ledger.LedgerParameters.initialParameters().dust);

console.log('Setting up Wallet B (counterparty)...');
const shieldedWalletB = ShieldedWallet(config).startWithShieldedSeed(walletBKeys.shieldedSeed);
const unshieldedKeystoreB = createKeystore(walletBKeys.unshieldedExternalSeed, networkId);
const unshieldedWalletB = UnshieldedWallet({
  ...config,
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
}).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystoreB));
const dustWalletB = DustWallet({
  ...config,
  costParameters: {
    additionalFeeOverhead: 900_000_000_000_000n,
    feeBlocksMargin: 5,
  },
}).startWithSeed(walletBKeys.dustSeed, ledger.LedgerParameters.initialParameters().dust);

const walletAFacade = new WalletFacade(shieldedWalletA, unshieldedWalletA, dustWalletA);
const walletBFacade = new WalletFacade(shieldedWalletB, unshieldedWalletB, dustWalletB);

console.log('Starting wallet facades...');
await Promise.all([
  walletAFacade.start(walletAKeys.shieldedSecretKeys, walletAKeys.dustSecretKey),
  walletBFacade.start(walletBKeys.shieldedSecretKeys, walletBKeys.dustSecretKey),
]);

console.log('Waiting for wallets to sync...');
await Promise.all([
  rx.firstValueFrom(walletAFacade.state().pipe(rx.filter((s) => s.isSynced))),
  rx.firstValueFrom(walletBFacade.state().pipe(rx.filter((s) => s.isSynced))),
]);

const walletAState = await rx.firstValueFrom(walletAFacade.state());
const walletBState = await rx.firstValueFrom(walletBFacade.state());

const shieldedAddressA = await walletAFacade.shielded.getAddress();
const shieldedAddressAStr = ShieldedAddress.codec.encode(networkId, shieldedAddressA).asString();

console.log('\n=== Wallet A (Initiator) ===');
console.log(`Shielded Address: ${shieldedAddressAStr}`);
console.log(`Shielded NIGHT: ${formatAmount(walletAState.shielded.balances[ledger.shieldedToken().raw] ?? 0n)}`);

console.log('\n=== Wallet B (Counterparty) ===');
const shieldedAddressB = await walletBFacade.shielded.getAddress();
console.log(`Shielded Address: ${ShieldedAddress.codec.encode(networkId, shieldedAddressB).asString()}`);
console.log(`Shielded NIGHT: ${formatAmount(walletBState.shielded.balances[ledger.shieldedToken().raw] ?? 0n)}`);

const shieldedTokenType = ledger.shieldedToken().raw;
const nativeShieldedTokenType = '0000000000000000000000000000000000000000000000000000000000000002';
const swapAmount = 10_000_000n;
const receiveAmount = 5_000_000n;

console.log('\n=== Initiating Shielded Swap ===');
console.log(`Wallet A offers: ${formatAmount(swapAmount)} shielded tokens`);
console.log(`Wallet A wants: ${formatAmount(receiveAmount)} native tokens`);

const desiredInputs: CombinedSwapInputs = {
  shielded: {
    [shieldedTokenType]: swapAmount,
  },
};

const desiredOutputs: CombinedSwapOutputs[] = [
  {
    type: 'shielded',
    outputs: [
      {
        type: nativeShieldedTokenType,
        amount: receiveAmount,
        receiverAddress: shieldedAddressAStr,
      },
    ],
  },
];

const ttl = new Date(Date.now() + 60 * 60 * 1000);

console.log('Creating swap transaction from Wallet A...');
const swapTx = await walletAFacade.initSwap(walletAKeys.shieldedSecretKeys, desiredInputs, desiredOutputs, ttl);
console.log('Swap transaction created ✓');

console.log('Finalizing swap transaction (generating proofs)...');
const finalizedSwapTx = await walletAFacade.finalizeTransaction({
  type: 'TransactionToProve',
  transaction: swapTx,
});
console.log('Swap transaction finalized ✓');

console.log('\nWallet B balancing the swap transaction...');
const walletBBalancedTx = await walletBFacade.balanceTransaction(
  walletBKeys.shieldedSecretKeys,
  walletBKeys.dustSecretKey,
  finalizedSwapTx,
  new Date(Date.now() + 60 * 60 * 1000),
);
console.log('Transaction balanced by Wallet B ✓');

console.log('Finalizing balanced transaction...');
const finalizedTx = await walletBFacade.finalizeTransaction(walletBBalancedTx);
console.log('Final transaction ready ✓');

console.log('Submitting transaction...');
const txHash = await walletBFacade.submitTransaction(finalizedTx);
console.log(`Transaction submitted ✓`);
console.log(`Transaction Hash: ${txHash}`);

console.log('\nWaiting for swap to complete...');
await Promise.all([
  rx.firstValueFrom(walletAFacade.state().pipe(rx.filter(({ shielded }) => shielded.pendingCoins.length === 0))),
  rx.firstValueFrom(walletBFacade.state().pipe(rx.filter(({ shielded }) => shielded.pendingCoins.length === 0))),
]);

const walletAStateAfter = await rx.firstValueFrom(walletAFacade.state());
const walletBStateAfter = await rx.firstValueFrom(walletBFacade.state());

console.log('\n=== Swap Completed ===');
console.log('Wallet A shielded balance:', formatAmount(walletAStateAfter.shielded.balances[shieldedTokenType] ?? 0n));
console.log('Wallet B shielded balance:', formatAmount(walletBStateAfter.shielded.balances[shieldedTokenType] ?? 0n));

await Promise.all([walletAFacade.stop(), walletBFacade.stop()]);
console.log('\nWallets stopped.');
