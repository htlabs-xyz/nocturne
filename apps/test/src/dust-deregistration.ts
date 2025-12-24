import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { config, formatAmount, MNEMONIC_1, networkId } from './config';
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

const walletKeys = deriveWalletKeys(MNEMONIC_1, 0, 0);

console.log('Setting up wallet...');
const shieldedWallet = ShieldedWallet(config).startWithShieldedSeed(walletKeys.shieldedSeed);
const unshieldedKeystore = createKeystore(walletKeys.unshieldedExternalSeed, networkId);
const unshieldedWallet = UnshieldedWallet({
  ...config,
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
}).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));
const dustWallet = DustWallet({
  ...config,
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
}).startWithSeed(walletKeys.dustSeed, ledger.LedgerParameters.initialParameters().dust);

const walletFacade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);

console.log('Starting wallet facade...');
await walletFacade.start(walletKeys.shieldedSecretKeys, walletKeys.dustSecretKey);

console.log('Waiting for wallet to sync...');
await rx.firstValueFrom(walletFacade.state().pipe(rx.filter((s) => s.isSynced)));

const walletState = await rx.firstValueFrom(
  walletFacade.state().pipe(rx.filter((s) => s.unshielded.availableCoins.length > 0)),
);

console.log('\n=== Wallet State ===');
console.log(`Unshielded NIGHT: ${formatAmount(walletState.unshielded.balances[ledger.nativeToken().raw] ?? 0n)}`);
console.log(`Dust Balance: ${formatAmount(walletState.dust.walletBalance(new Date()) ?? 0n)}`);

const availableCoinsWithInfo = walletState.dust.availableCoinsWithFullInfo(new Date());
console.log(`Available dust coins: ${availableCoinsWithInfo.length}`);
console.log(`Coins without dtime: ${availableCoinsWithInfo.filter((c) => c.dtime === undefined).length}`);

const nightUtxosRegistered = walletState.unshielded.availableCoins.filter(
  (coin) => coin.meta.registeredForDustGeneration === true,
);

console.log(`\nFound ${nightUtxosRegistered.length} NIGHT UTXOs registered for dust generation`);

if (nightUtxosRegistered.length === 0) {
  console.log('\nNo UTXOs registered for dust generation. Nothing to deregister.');
  await walletFacade.stop();
  process.exit(0);
}

const deregisterCount = Math.min(2, nightUtxosRegistered.length);
const utxosToDeregister = nightUtxosRegistered.slice(0, deregisterCount);

console.log(`\n=== Deregistering ${deregisterCount} UTXOs from Dust Generation ===`);

const dustDeregistrationRecipe = await walletFacade.deregisterFromDustGeneration(
  utxosToDeregister,
  unshieldedKeystore.getPublicKey(),
  (payload) => unshieldedKeystore.signData(payload),
);

console.log('Balancing deregistration transaction...');
const balancedTransactionRecipe = await walletFacade.balanceTransaction(
  walletKeys.shieldedSecretKeys,
  walletKeys.dustSecretKey,
  dustDeregistrationRecipe.transaction,
  new Date(Date.now() + 30 * 60 * 1000),
);

if (balancedTransactionRecipe.type !== 'TransactionToProve') {
  throw new Error('Expected a transaction to prove');
}

console.log('Finalizing deregistration transaction...');
const finalizedDustTx = await walletFacade.finalizeTransaction(balancedTransactionRecipe);

console.log('Submitting deregistration transaction...');
const dustDeregistrationTxHash = await walletFacade.submitTransaction(finalizedDustTx);
console.log(`Deregistration TX Hash: ${dustDeregistrationTxHash}`);

console.log('\nWaiting for deregistration to complete...');
const newWalletState = await rx.firstValueFrom(
  walletFacade
    .state()
    .pipe(
      rx.filter((s) => s.unshielded.availableCoins.some((coin) => coin.meta.registeredForDustGeneration === false)),
    ),
);

console.log('\n=== Deregistration Completed ===');
const availableCoinsAfter = newWalletState.dust.availableCoinsWithFullInfo(new Date());
const coinsWithDtime = availableCoinsAfter.filter((coin) => coin.dtime !== undefined);

console.log(`Coins with dtime (deregistered): ${coinsWithDtime.length}`);
console.log(`Unshielded NIGHT: ${formatAmount(newWalletState.unshielded.balances[ledger.nativeToken().raw] ?? 0n)}`);
console.log(`Dust Balance: ${formatAmount(newWalletState.dust.walletBalance(new Date()) ?? 0n)}`);

await walletFacade.stop();
console.log('\nWallet stopped.');
