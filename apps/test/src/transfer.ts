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

const senderUnshieldedKeystore = createKeystore(senderKeys.unshieldedExternalSeed, networkId);
const unshieldedWallet = UnshieldedWallet({
  ...config,
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
}).startWithPublicKey(PublicKey.fromKeyStore(senderUnshieldedKeystore));
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

const bigIntReplacer = (_key: string, value: unknown) => (typeof value === 'bigint' ? value.toString() : value);

console.log('shield', JSON.stringify(senderState.shielded, bigIntReplacer, 2));
console.log('unshield', JSON.stringify(senderState.unshielded, bigIntReplacer, 2));
console.log('dust', JSON.stringify(senderState.dust, bigIntReplacer, 2));

const nightBalance = senderState.unshielded.balances[ledger.nativeToken().raw] ?? 0n;
console.log(`Night (unshielded): ${formatAmount(nightBalance)}`);

const receiverUnshieldedAddress = 'mn_addr_preview1uw802k35dvqxyqs7xm9p3fa8s4yvfy8qax8ufdr8tkxsa4f70kqs5g8gaz';

const transferOutputs = [
  {
    type: 'unshielded' as const,
    outputs: [
      {
        amount: 5_000_000n,
        receiverAddress: receiverUnshieldedAddress,
        type: ledger.unshieldedToken().raw,
      },
    ],
  },
];

const expiryTime = new Date(Date.now() + 30 * 60 * 1000);
const recipe = await senderFacade.transferTransaction(
  senderKeys.shieldedSecretKeys,
  senderKeys.dustSecretKey,
  transferOutputs,
  expiryTime,
);

console.log('Transaction recipe created ✓', recipe.transaction);

console.log('Signing transaction...');
const signedTx = await senderFacade.signTransaction(recipe.transaction, (payload) =>
  senderUnshieldedKeystore.signData(payload),
);
// console.log('Transaction signed ✓', signedTx);

console.log('Finalizing transaction (generating proofs)...');
const finalizedTx = await senderFacade.finalizeTransaction({
  type: 'TransactionToProve',
  transaction: signedTx,
});
console.log('Transaction finalized ✓', finalizedTx);

console.log('Submitting transaction...');
const txId = await senderFacade.submitTransaction(finalizedTx);
console.log(`Transaction ID: ${txId}\n`);
