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
import type { UtxoWithMeta } from '@midnight-ntwrk/wallet-sdk-facade';
import * as rx from 'rxjs';
import { NETWORK_CONFIG, TEST_MNEMONIC } from './config';
import { deriveWalletKeys, printWalletInfo } from './wallet';

async function waitForFullySynced(facade: WalletFacade): Promise<void> {
  await rx.firstValueFrom(facade.state().pipe(rx.filter((s) => s.isSynced)));
}

function formatDust(value: bigint): string {
  const dustStr = value.toString();
  if (dustStr.length <= 6) {
    return `0.${dustStr.padStart(6, '0')} DUST`;
  }
  const intPart = dustStr.slice(0, -6);
  const decPart = dustStr.slice(-6);
  return `${intPart}.${decPart} DUST`;
}

function formatTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export async function runDustFromNightTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Midnight Wallet SDK - Dust from Night              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Network: ${NETWORK_CONFIG.networkId}`);
  console.log(`Indexer: ${NETWORK_CONFIG.indexerHttp}`);
  console.log(`Node: ${NETWORK_CONFIG.nodeUrl}`);
  console.log(`Prover: ${NETWORK_CONFIG.proofServer}\n`);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Deriving Wallet Keys from Mnemonic                         │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log(`Mnemonic: ${TEST_MNEMONIC.split(' ').slice(0, 4).join(' ')}...\n`);

  const walletKeys = deriveWalletKeys(TEST_MNEMONIC, 0, 0);
  printWalletInfo(walletKeys);

  const networkId = NETWORK_CONFIG.networkId as NetworkId.NetworkId;
  const dustParameters = ledger.LedgerParameters.initialParameters().dust;

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ Creating Wallet Configuration                              │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const config = {
    indexerClientConnection: {
      indexerHttpUrl: NETWORK_CONFIG.indexerHttp,
      indexerWsUrl: NETWORK_CONFIG.indexerWs,
    },
    provingServerUrl: new URL(NETWORK_CONFIG.proofServer),
    relayURL: new URL(NETWORK_CONFIG.nodeUrl),
    networkId,
  };

  const unshieldedKeystore = createKeystore(walletKeys.unshieldedExternalSeed, networkId);

  console.log('Creating Shielded Wallet...');
  const shieldedWallet = ShieldedWallet(config).startWithShieldedSeed(walletKeys.shieldedSeed);

  console.log('Creating Unshielded Wallet...');
  const unshieldedWallet = UnshieldedWallet({
    ...config,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));

  console.log('Creating Dust Wallet...');
  const dustWallet = DustWallet({
    ...config,
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
  }).startWithSeed(walletKeys.dustSeed, dustParameters);

  console.log('Creating Wallet Facade...\n');
  const facade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Starting Wallet Sync                                       │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('Starting wallet components...');
  await facade.start(walletKeys.shieldedSecretKeys, walletKeys.dustSecretKey);

  console.log('Waiting for sync to complete...');
  await waitForFullySynced(facade);

  const state = await rx.firstValueFrom(facade.state());

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ Current Wallet State                                       │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('=== Unshielded Wallet (Night) ===');
  console.log(`Available coins: ${state.unshielded.availableCoins.length}`);
  const nightBalance = state.unshielded.balances[ledger.nativeToken().raw] ?? 0n;
  console.log(`Night balance: ${nightBalance}`);

  console.log('\n=== Dust Wallet ===');
  console.log(`Available coins: ${state.dust.availableCoins.length}`);
  console.log(`Dust balance: ${formatDust(state.dust.walletBalance(new Date()))}`);

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ Real-time Dust Balance Monitor                             │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('Monitoring dust balance in real-time... (Press Ctrl+C to stop)\n');

  let lastBalance = state.dust.walletBalance(new Date());
  let lastCoins = state.dust.availableCoins.length;

  const subscription = facade.state().subscribe({
    next: (s) => {
      const currentBalance = s.dust.walletBalance(new Date());
      const currentCoins = s.dust.availableCoins.length;

      if (currentBalance !== lastBalance || currentCoins !== lastCoins) {
        const diff = currentBalance - lastBalance;
        const diffStr = diff > 0n ? `+${formatDust(diff)}` : formatDust(diff);
        console.log(
          `[${formatTimestamp()}] Dust: ${formatDust(currentBalance)} | Coins: ${currentCoins} | Change: ${diffStr}`,
        );
        lastBalance = currentBalance;
        lastCoins = currentCoins;
      }
    },
    error: (err) => {
      console.error('Stream error:', err);
    },
  });

  const nightUtxos: UtxoWithMeta[] = state.unshielded.availableCoins
    .filter(
      (coin) =>
        coin.meta.registeredForDustGeneration === false &&
        coin.utxo.type === ledger.nativeToken().raw,
    )
    .map((coin) => ({
      utxo: coin.utxo,
      meta: { ctime: coin.meta.ctime },
    }));

  console.log(`Night UTXOs not registered for dust: ${nightUtxos.length}`);

  if (nightUtxos.length === 0) {
    console.log('\n⚠️  No Night UTXOs available for dust generation.');
    console.log('   Continuing to monitor existing dust balance...');
    console.log('   To generate more dust, receive Night tokens from another wallet.\n');

    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => {
        console.log('\n\nStopping monitor...');
        subscription.unsubscribe();
        resolve();
      });
    });

    await facade.stop();
    return true;
  }

  const totalNightValue = nightUtxos.reduce((sum, { utxo }) => sum + utxo.value, 0n);
  console.log(`Total Night value available: ${totalNightValue}\n`);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Registering Night UTXOs for Dust Generation                │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('Creating dust registration transaction...');
  const dustRegistrationRecipe = await facade.registerNightUtxosForDustGeneration(
    nightUtxos,
    unshieldedKeystore.getPublicKey(),
    (payload) => unshieldedKeystore.signData(payload),
  );

  console.log('Finalizing transaction...');
  const finalizedTx = await facade.finalizeTransaction(dustRegistrationRecipe);

  console.log('Submitting transaction...');
  const txHash = await facade.submitTransaction(finalizedTx);
  console.log(`Transaction submitted: ${txHash}\n`);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Watching Dust Generation in Real-time                      │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('Waiting for dust to be generated... (updates will appear below)\n');

  await new Promise<void>((resolve) => {
    let resolved = false;

    const checkSubscription = facade.state().subscribe({
      next: (s) => {
        if (!resolved && s.isSynced && s.dust.availableCoins.length > state.dust.availableCoins.length) {
          resolved = true;
          console.log('\n✅ Dust generation detected!\n');
          checkSubscription.unsubscribe();
          resolve();
        }
      },
    });

    process.on('SIGINT', () => {
      if (!resolved) {
        resolved = true;
        console.log('\n\nStopping early...');
        checkSubscription.unsubscribe();
        resolve();
      }
    });
  });

  subscription.unsubscribe();

  const finalState = await rx.firstValueFrom(facade.state());

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Final Wallet State                                         │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('=== Unshielded Wallet (Night) ===');
  console.log(`Available coins: ${finalState.unshielded.availableCoins.length}`);
  const finalNightBalance = finalState.unshielded.balances[ledger.nativeToken().raw] ?? 0n;
  console.log(`Night balance: ${finalNightBalance}`);

  console.log('\n=== Dust Wallet ===');
  console.log(`Available coins: ${finalState.dust.availableCoins.length}`);
  console.log(`Dust balance: ${formatDust(finalState.dust.walletBalance(new Date()))}`);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║               DUST GENERATION COMPLETE                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await facade.stop();
  return true;
}

if (import.meta.main) {
  runDustFromNightTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed with error:', error);
      process.exit(1);
    });
}
