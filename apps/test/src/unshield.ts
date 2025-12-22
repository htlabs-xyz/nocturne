import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import {
  UnshieldedWallet,
  createKeystore,
  PublicKey,
  InMemoryTransactionHistoryStorage,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import * as rx from 'rxjs';
import { NETWORK_CONFIG } from './config';

function getUnshieldedSeed(seedHex: string): Uint8Array {
  const seed = Buffer.from(seedHex, 'hex');
  const hdResult = HDWallet.fromSeed(seed);
  if (hdResult.type !== 'seedOk') {
    throw new Error('Failed to create HD wallet');
  }
  const keysResult = hdResult.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.NightExternal, Roles.NightInternal] as const)
    .deriveKeysAt(0);
  if (keysResult.type !== 'keysDerived') {
    throw new Error('Failed to derive keys');
  }
  return keysResult.keys[Roles.NightExternal];
}

export async function runUnshieldedWalletTest() {
  console.log('=== Unshielded Wallet Test ===\n');
  console.log(`Network: ${NETWORK_CONFIG.networkId}`);
  console.log(`Indexer: ${NETWORK_CONFIG.indexerHttp}\n`);

  const senderSeed = '0000000000000000000000000000000000000000000000000000000000000001';
  const unshieldedSeed = getUnshieldedSeed(senderSeed);
  const networkId = NETWORK_CONFIG.networkId as NetworkId.NetworkId;

  const config = {
    indexerClientConnection: {
      indexerHttpUrl: NETWORK_CONFIG.indexerHttp,
      indexerWsUrl: NETWORK_CONFIG.indexerWs,
    },
    networkId,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  };

  console.log('Creating keystore from seed...');
  const keystore = createKeystore(unshieldedSeed, networkId);
  console.log(`Public Key: ${keystore.getPublicKey()}\n`);

  console.log('Creating unshielded wallet...');
  const wallet = UnshieldedWallet(config).startWithPublicKey(PublicKey.fromKeyStore(keystore));

  const address = await wallet.getAddress();
  console.log(`Wallet address: ${UnshieldedAddress.codec.encode(networkId, address).asString()}\n`);

  console.log('Starting wallet sync...');
  await wallet.start();

  console.log('Waiting for sync to complete...');
  await wallet.waitForSyncedState(0n);

  const state = await rx.firstValueFrom(wallet.state);
  console.log('\n=== Wallet State ===');
  console.log(`Available coins: ${state.availableCoins.length}`);
  console.log(`Pending coins: ${state.pendingCoins.length}`);
  console.log(`Balance: ${JSON.stringify(state.balances)}`);

  console.log('\n=== Test Complete ===');

  await wallet.stop();
  return true;
}

if (import.meta.main) {
  runUnshieldedWalletTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed with error:', error);
      process.exit(1);
    });
}
