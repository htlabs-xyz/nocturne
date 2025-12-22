import * as ledger from '@midnight-ntwrk/ledger-v6';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { ShieldedAddress, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
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
import { NETWORK_CONFIG, TEST_MNEMONIC } from './config';
import { deriveWalletKeys, printWalletInfo } from './wallet';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Midnight Wallet SDK - Facade Test                  ║');
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

  console.log('Creating Shielded Wallet...');
  const shieldedWallet = ShieldedWallet(config).startWithShieldedSeed(walletKeys.shieldedSeed);
  const shieldedAddress = await shieldedWallet.getAddress();
  console.log(`Shielded Address: ${ShieldedAddress.codec.encode(networkId, shieldedAddress).asString()}\n`);

  console.log('Creating Unshielded Wallet...');
  const unshieldedKeystore = createKeystore(walletKeys.unshieldedExternalSeed, networkId);
  const unshieldedWallet = UnshieldedWallet({
    ...config,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));
  const unshieldedAddress = await unshieldedWallet.getAddress();
  console.log(`Unshielded Address: ${UnshieldedAddress.codec.encode(networkId, unshieldedAddress).asString()}\n`);

  console.log('Creating Dust Wallet...');
  const dustWallet = DustWallet({
    ...config,
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
  }).startWithSeed(walletKeys.dustSeed, dustParameters);
  const dustState = await rx.firstValueFrom(dustWallet.state);
  console.log(`Dust Address: ${dustState.dustAddress}\n`);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ Creating Wallet Facade                                     │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const facade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);
  console.log('Facade created successfully!\n');

  console.log('Starting wallet sync...');
  await facade.start(walletKeys.shieldedSecretKeys, walletKeys.dustSecretKey);
  console.log('Wallet sync started\n');

  console.log('Waiting for sync to complete...');
  const state = await rx.firstValueFrom(
    facade.state().pipe(rx.filter((s) => s.isSynced)),
  );

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ Wallet State                                               │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('=== Shielded Wallet ===');
  console.log(`Available coins: ${state.shielded.availableCoins.length}`);
  console.log(`Balances: ${JSON.stringify(state.shielded.balances, (_, v) => typeof v === 'bigint' ? v.toString() : v)}\n`);

  console.log('=== Unshielded Wallet ===');
  console.log(`Available coins: ${state.unshielded.availableCoins.length}`);
  console.log(`Balances: ${JSON.stringify(state.unshielded.balances, (_, v) => typeof v === 'bigint' ? v.toString() : v)}\n`);

  console.log('=== Dust Wallet ===');
  console.log(`Available coins: ${state.dust.availableCoins.length}`);
  console.log(`Balance: ${state.dust.walletBalance(new Date())}\n`);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await facade.stop();
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
