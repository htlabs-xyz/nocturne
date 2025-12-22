import { LedgerParameters, DustSecretKey } from '@midnight-ntwrk/ledger-v6';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import * as rx from 'rxjs';
import { NETWORK_CONFIG } from './config';

function getDustSeed(seedHex: string): Uint8Array {
  const seed = Buffer.from(seedHex, 'hex');
  const hdResult = HDWallet.fromSeed(seed);
  if (hdResult.type !== 'seedOk') {
    throw new Error('Failed to create HD wallet');
  }
  const keysResult = hdResult.hdWallet.selectAccount(0).selectRole(Roles.Dust).deriveKeyAt(0);
  if (keysResult.type !== 'keyDerived') {
    throw new Error('Failed to derive key');
  }
  return keysResult.key;
}

export async function runDustWalletTest() {
  console.log('=== Dust Wallet Test ===\n');
  console.log(`Network: ${NETWORK_CONFIG.networkId}`);
  console.log(`Indexer: ${NETWORK_CONFIG.indexerHttp}`);
  console.log(`Prover: ${NETWORK_CONFIG.proofServer}\n`);

  const SEED = '0000000000000000000000000000000000000000000000000000000000000001';
  const networkId = NETWORK_CONFIG.networkId as NetworkId.NetworkId;

  const dustSeed = getDustSeed(SEED);
  const dustSecretKey = DustSecretKey.fromSeed(dustSeed);
  const dustParameters = LedgerParameters.initialParameters().dust;

  console.log('Dust seed derived from HD wallet\n');

  const config = {
    indexerClientConnection: {
      indexerHttpUrl: NETWORK_CONFIG.indexerHttp,
      indexerWsUrl: NETWORK_CONFIG.indexerWs,
    },
    provingServerUrl: new URL(NETWORK_CONFIG.proofServer),
    relayURL: new URL(NETWORK_CONFIG.nodeUrl),
    networkId,
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
  };

  console.log('Creating DustWallet instance...');
  const DustWalletClass = DustWallet(config);
  const wallet = DustWalletClass.startWithSeed(dustSeed, dustParameters);

  console.log('Wallet created successfully\n');

  const state = await rx.firstValueFrom(wallet.state);
  console.log('=== Wallet State ===');
  console.log(`Protocol version: ${state.protocolVersion}`);
  console.log(`Dust address: ${state.dustAddress}`);
  console.log(`Dust public key available: ${state.dustPublicKey !== undefined}`);
  console.log(`Available coins: ${state.availableCoins.length}`);
  console.log(`Pending coins: ${state.pendingCoins.length}`);
  console.log(`Total coins: ${state.totalCoins.length}\n`);

  console.log('Starting wallet sync...');
  await wallet.start(dustSecretKey);

  console.log('Waiting for sync to complete...');
  const syncedState = await wallet.waitForSyncedState(0n);

  console.log('\n=== Synced Wallet State ===');
  console.log(`Dust address: ${syncedState.dustAddress}`);
  console.log(`Available coins: ${syncedState.availableCoins.length}`);
  console.log(`Pending coins: ${syncedState.pendingCoins.length}`);

  const balance = syncedState.walletBalance(new Date());
  console.log(`Wallet balance: ${balance}`);

  console.log('\n=== Test Complete ===');
  return true;
}

if (import.meta.main) {
  runDustWalletTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed with error:', error);
      process.exit(1);
    });
}
