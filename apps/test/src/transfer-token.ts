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
import { MidnightBech32m } from '@midnight-ntwrk/wallet-sdk-address-format';
import * as rx from 'rxjs';
import { config, MNEMONIC_1, networkId } from './config';
import { deriveWalletKeys, generateMnemonic, printWalletInfo, type WalletKeys } from './wallet';

type TransferType = 'night' | 'shielded' | 'both';

interface TransferConfig {
  type: TransferType;
  nightAmount?: bigint;
  shieldedAmount?: bigint;
}

const DEFAULT_TRANSFER: TransferConfig = {
  type: 'both',
  nightAmount: 1_000_000n,
  shieldedAmount: 1_000_000n,
};

async function waitForFullySynced(facade: WalletFacade): Promise<void> {
  await rx.firstValueFrom(facade.state().pipe(rx.filter((s) => s.isSynced)));
}

function formatAmount(value: bigint, decimals: number = 6): string {
  const str = value.toString();
  if (str.length <= decimals) {
    return `0.${str.padStart(decimals, '0')}`;
  }
  const intPart = str.slice(0, -decimals);
  const decPart = str.slice(-decimals);
  return `${intPart}.${decPart}`;
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

export async function runTransferTest(transferConfig: TransferConfig = DEFAULT_TRANSFER) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Midnight Wallet SDK - Token Transfer               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Network: ${networkId}`);
  console.log(`Transfer Type: ${transferConfig.type}`);
  if (transferConfig.nightAmount) console.log(`Night Amount: ${formatAmount(transferConfig.nightAmount)}`);
  if (transferConfig.shieldedAmount) console.log(`Shielded Amount: ${formatAmount(transferConfig.shieldedAmount)}\n`);

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
  const shieldedBalance = senderState.shielded.balances[ledger.shieldedToken().raw] ?? 0n;

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Sender Balance                                             │');
  console.log('└────────────────────────────────────────────────────────────┘\n');
  console.log(`Night (unshielded): ${formatAmount(nightBalance)}`);
  console.log(`Shielded: ${formatAmount(shieldedBalance)}\n`);

  const receiverShieldedAddress = await rx.firstValueFrom(
    receiverFacade.state().pipe(
      rx.filter((s) => s.isSynced),
      rx.map((s) => MidnightBech32m.encode(networkId, s.shielded.address).toString()),
    ),
  );
  const receiverUnshieldedAddress = receiverKeystore.getBech32Address().toString();

  console.log('Receiver addresses:');
  console.log(`  Shielded: ${receiverShieldedAddress.slice(0, 30)}...`);
  console.log(`  Unshielded: ${receiverUnshieldedAddress.slice(0, 30)}...\n`);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Creating Transfer Transaction                              │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const transferOutputs: Array<
    | { type: 'unshielded'; outputs: Array<{ amount: bigint; receiverAddress: string; type: string }> }
    | { type: 'shielded'; outputs: Array<{ amount: bigint; receiverAddress: string; type: string }> }
  > = [];

  if (transferConfig.type === 'night' || transferConfig.type === 'both') {
    if (!transferConfig.nightAmount) throw new Error('Night amount required');
    if (nightBalance < transferConfig.nightAmount) {
      console.log(
        `⚠️ Insufficient Night balance. Have: ${formatAmount(nightBalance)}, Need: ${formatAmount(transferConfig.nightAmount)}`,
      );
    } else {
      transferOutputs.push({
        type: 'unshielded',
        outputs: [
          {
            amount: transferConfig.nightAmount,
            receiverAddress: receiverUnshieldedAddress,
            type: ledger.unshieldedToken().raw,
          },
        ],
      });
      console.log(
        `✓ Night transfer: ${formatAmount(transferConfig.nightAmount)} → ${receiverUnshieldedAddress.slice(0, 20)}...`,
      );
    }
  }

  if (transferConfig.type === 'shielded' || transferConfig.type === 'both') {
    if (!transferConfig.shieldedAmount) throw new Error('Shielded amount required');
    if (shieldedBalance < transferConfig.shieldedAmount) {
      console.log(
        `⚠️ Insufficient Shielded balance. Have: ${formatAmount(shieldedBalance)}, Need: ${formatAmount(transferConfig.shieldedAmount)}`,
      );
    } else {
      transferOutputs.push({
        type: 'shielded',
        outputs: [
          {
            amount: transferConfig.shieldedAmount,
            receiverAddress: receiverShieldedAddress,
            type: ledger.shieldedToken().raw,
          },
        ],
      });
      console.log(
        `✓ Shielded transfer: ${formatAmount(transferConfig.shieldedAmount)} → ${receiverShieldedAddress.slice(0, 20)}...`,
      );
    }
  }

  if (transferOutputs.length === 0) {
    console.log('\n⚠️ No valid transfers to execute. Check balances.\n');
    await senderFacade.stop();
    await receiverFacade.stop();
    return false;
  }

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
      rx.filter((s) => {
        const hasNight = s.unshielded.availableCoins.length > 0;
        const hasShielded = s.shielded.availableCoins.length > 0;
        return hasNight || hasShielded;
      }),
    ),
  );

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ Transfer Results                                           │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const receiverNightBalance = finalReceiverState.unshielded.balances[ledger.nativeToken().raw] ?? 0n;
  const receiverShieldedBalance = finalReceiverState.shielded.balances[ledger.shieldedToken().raw] ?? 0n;

  console.log('Receiver final balances:');
  console.log(`  Night: ${formatAmount(receiverNightBalance)}`);
  console.log(`  Shielded: ${formatAmount(receiverShieldedBalance)}\n`);

  let success = true;
  if (transferConfig.type === 'night' || transferConfig.type === 'both') {
    if (transferConfig.nightAmount && receiverNightBalance >= transferConfig.nightAmount) {
      console.log(`✅ Night transfer: PASSED`);
    } else if (transferConfig.nightAmount) {
      console.log(`❌ Night transfer: FAILED`);
      success = false;
    }
  }
  if (transferConfig.type === 'shielded' || transferConfig.type === 'both') {
    if (transferConfig.shieldedAmount && receiverShieldedBalance >= transferConfig.shieldedAmount) {
      console.log(`✅ Shielded transfer: PASSED`);
    } else if (transferConfig.shieldedAmount) {
      console.log(`❌ Shielded transfer: FAILED`);
      success = false;
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║          TRANSFER ${success ? 'COMPLETE ✅' : 'FAILED ❌'}                            ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await senderFacade.stop();
  await receiverFacade.stop();

  return success;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const type = (args[0] as TransferType) || 'both';
  const amount = args[1] ? BigInt(args[1]) : 1_000_000n;

  const config: TransferConfig = {
    type,
    nightAmount: type !== 'shielded' ? amount : undefined,
    shieldedAmount: type !== 'night' ? amount : undefined,
  };

  runTransferTest(config)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Transfer failed with error:', error);
      process.exit(1);
    });
}
