import * as ledger from '@midnight-ntwrk/ledger-v6';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import {
  UnshieldedWallet,
  createKeystore,
  PublicKey,
  InMemoryTransactionHistoryStorage,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import * as rx from 'rxjs';
import { config, MNEMONIC_1, networkId, formatAmount } from './config';
import { deriveWalletKeys, generateMnemonic, printWalletInfo, type WalletKeys } from './wallet';

async function waitForFullySynced(facade: WalletFacade): Promise<void> {
  await rx.firstValueFrom(facade.state().pipe(rx.filter((s) => s.isSynced)));
}

function createWalletFacade(walletKeys: WalletKeys, networkId: NetworkId.NetworkId) {
  const dustParameters = ledger.LedgerParameters.initialParameters().dust;
  const unshieldedKeystore = createKeystore(walletKeys.unshieldedExternalSeed, networkId);

  const shieldedWallet = ShieldedWallet(config).startWithShieldedSeed(walletKeys.shieldedSeed);
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
  }).startWithSeed(walletKeys.dustSeed, dustParameters);

  const facade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);

  return { facade, unshieldedKeystore };
}

export async function transferNight(amount: bigint = 1_000_000n) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Midnight Wallet SDK - Night Transfer               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Network: ${networkId}`);
  console.log(`Amount: ${formatAmount(amount)}\n`);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Setting Up Sender Wallet                                   │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const senderKeys = deriveWalletKeys(MNEMONIC_1, 0, 0);
  console.log('Sender wallet keys:');
  printWalletInfo(senderKeys);

  const { facade: senderFacade, unshieldedKeystore: senderKeystore } = createWalletFacade(senderKeys, networkId);

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ Setting Up Receiver Wallet                                 │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const receiverMnemonic = generateMnemonic();
  const receiverKeys = deriveWalletKeys(receiverMnemonic, 0, 0);
  console.log(`Receiver mnemonic: ${receiverMnemonic.split(' ').slice(0, 4).join(' ')}...`);
  console.log('Receiver wallet keys:');
  printWalletInfo(receiverKeys);

  const { facade: receiverFacade, unshieldedKeystore: receiverKeystore } = createWalletFacade(receiverKeys, networkId);

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ Starting Wallet Sync                                       │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('Starting sender wallet...');
  await senderFacade.start(senderKeys.shieldedSecretKeys, senderKeys.dustSecretKey);
  await waitForFullySynced(senderFacade);
  console.log('Sender wallet synced ✓');

  console.log('Starting receiver wallet...');
  await receiverFacade.start(receiverKeys.shieldedSecretKeys, receiverKeys.dustSecretKey);
  await waitForFullySynced(receiverFacade);
  console.log('Receiver wallet synced ✓\n');

  const senderState = await rx.firstValueFrom(senderFacade.state());
  const nightBalance = senderState.unshielded.balances[ledger.nativeToken().raw] ?? 0n;

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Sender Balance                                             │');
  console.log('└────────────────────────────────────────────────────────────┘\n');
  console.log(`Night (unshielded): ${formatAmount(nightBalance)}\n`);

  if (nightBalance < amount) {
    console.log(`⚠️ Insufficient Night balance. Have: ${formatAmount(nightBalance)}, Need: ${formatAmount(amount)}`);
    await senderFacade.stop();
    await receiverFacade.stop();
    return false;
  }

  const receiverUnshieldedAddress = receiverKeystore.getBech32Address().toString();
  console.log(`Receiver address: ${receiverUnshieldedAddress.slice(0, 30)}...\n`);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Creating Night Transfer Transaction                        │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const transferOutputs = [
    {
      type: 'unshielded' as const,
      outputs: [
        {
          amount,
          receiverAddress: receiverUnshieldedAddress,
          type: ledger.unshieldedToken().raw,
        },
      ],
    },
  ];

  console.log(`✓ Night transfer: ${formatAmount(amount)} → ${receiverUnshieldedAddress.slice(0, 20)}...`);

  console.log('\nBuilding transaction...');
  const expiryTime = new Date(Date.now() + 30 * 60 * 1000);

  const recipe = await senderFacade.transferTransaction(
    senderKeys.shieldedSecretKeys,
    senderKeys.dustSecretKey,
    transferOutputs,
    expiryTime,
  );
  console.log('Transaction recipe created ✓');

  console.log('Signing transaction...');
  const signedTx = await senderFacade.signTransaction(recipe.transaction, (payload) =>
    senderKeystore.signData(payload),
  );
  console.log('Transaction signed ✓');

  console.log('Finalizing transaction (generating proofs)...');
  const finalizedTx = await senderFacade.finalizeTransaction({
    type: 'TransactionToProve',
    transaction: signedTx,
  });
  console.log('Transaction finalized ✓');

  console.log('Submitting transaction...');
  const txId = await senderFacade.submitTransaction(finalizedTx);
  console.log(`Transaction submitted ✓`);
  console.log(`Transaction ID: ${txId}\n`);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Waiting for Receiver Confirmation                          │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('Waiting for receiver to receive tokens...');

  const finalReceiverState = await rx.firstValueFrom(
    receiverFacade.state().pipe(
      rx.filter((s) => s.isSynced),
      rx.filter((s) => s.unshielded.availableCoins.length > 0),
    ),
  );

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ Transfer Results                                           │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const receiverNightBalance = finalReceiverState.unshielded.balances[ledger.nativeToken().raw] ?? 0n;
  console.log(`Receiver Night balance: ${formatAmount(receiverNightBalance)}\n`);

  const success = receiverNightBalance >= amount;
  if (success) {
    console.log(`✅ Night transfer: PASSED`);
  } else {
    console.log(`❌ Night transfer: FAILED`);
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║          NIGHT TRANSFER ${success ? 'COMPLETE ✅' : 'FAILED ❌'}                       ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await senderFacade.stop();
  await receiverFacade.stop();

  return success;
}

if (import.meta.main) {
  const amount = process.argv[2] ? BigInt(process.argv[2]) : 1_000_000n;

  transferNight(amount)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Transfer failed with error:', error);
      process.exit(1);
    });
}
