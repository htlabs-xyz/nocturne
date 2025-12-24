import { config, MNEMONIC_2, networkId } from './config';
import { deriveWalletKeys, printWalletInfo } from './wallet';
import * as ledger from '@midnight-ntwrk/ledger-v6';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { ShieldedAddress, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import * as rx from 'rxjs';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';

const walletKeys = deriveWalletKeys(MNEMONIC_2, 0, 0);
// console.log(JSON.stringify(walletKeys, null, 2));
printWalletInfo(walletKeys);

// shield
const shieldedWallet = ShieldedWallet(config).startWithShieldedSeed(walletKeys.shieldedSeed);
const shieldedAddress = await shieldedWallet.getAddress();
console.log(`Shielded Address: ${ShieldedAddress.codec.encode(networkId, shieldedAddress).asString()}`);
// unshield
const unshieldedKeystore = createKeystore(walletKeys.unshieldedExternalSeed, networkId);
const unshieldedWallet = UnshieldedWallet({
  ...config,
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
}).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));

const unshieldedAddress = await unshieldedWallet.getAddress();
console.log(`Unshielded Address: ${UnshieldedAddress.codec.encode(networkId, unshieldedAddress).asString()}`);
//dust
const dustWallet = DustWallet({
  ...config,
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
}).startWithSeed(walletKeys.dustSeed, ledger.LedgerParameters.initialParameters().dust);
const dustState = await rx.firstValueFrom(dustWallet.state);
console.log(`Dust Address: ${dustState.dustAddress}\n`);

//facade

const facade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);
await facade.start(walletKeys.shieldedSecretKeys, walletKeys.dustSecretKey);

const state = await rx.firstValueFrom(facade.state().pipe(rx.filter((s) => s.isSynced)));

console.log('shield', state.shielded.availableCoins);

console.log('unshield', state.unshielded.availableCoins);

console.log('dust', state.dust.availableCoins);
