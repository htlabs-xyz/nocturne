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
import { ShieldedAddress, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';

const senderKeys = deriveWalletKeys(MNEMONIC_1, 0, 0);
const shieldedWallet = ShieldedWallet(config).startWithShieldedSeed(senderKeys.shieldedSeed);
const unshieldedWallet = UnshieldedWallet({
  ...config,
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
}).startWithPublicKey(PublicKey.fromKeyStore(createKeystore(senderKeys.unshieldedExternalSeed, networkId)));
const dustWallet = DustWallet({
  ...config,
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
}).startWithSeed(senderKeys.dustSeed, ledger.LedgerParameters.initialParameters().dust);

const shieldedAddress = await shieldedWallet.getAddress();
console.log(`Shielded Address: ${ShieldedAddress.codec.encode(networkId, shieldedAddress).asString()}`);
const unshieldedAddress = await unshieldedWallet.getAddress();
console.log(`Unshielded Address: ${UnshieldedAddress.codec.encode(networkId, unshieldedAddress).asString()}`);
const dustState = await rx.firstValueFrom(dustWallet.state);
console.log(`Dust Address: ${dustState.dustAddress}\n`);

const senderFacade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);
await senderFacade.start(senderKeys.shieldedSecretKeys, senderKeys.dustSecretKey);
await rx.firstValueFrom(senderFacade.state().pipe(rx.filter((s) => s.isSynced)));
const senderState = await rx.firstValueFrom(senderFacade.state());

console.log('shield', senderState.shielded.availableCoins);
console.log('unshield', senderState.unshielded.availableCoins);
console.log('dust', senderState.dust.availableCoins);
