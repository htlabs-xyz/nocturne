import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import * as ledger from '@midnight-ntwrk/ledger-v6';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { ShieldedAddress, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import * as rx from 'rxjs';
import { mnemonicToHexSeed, getShieldedSeed, getUnshieldedSeed, getDustSeed, waitForFullySynced } from './utils.js';
import { MNEMONIC_1, networkId } from './config.js';

vi.setConfig({ testTimeout: 200_000, hookTimeout: 120_000 });

describe('Wallet Build', () => {
  const SEED = mnemonicToHexSeed(MNEMONIC_1);

  const shieldedWalletSeed = getShieldedSeed(SEED);
  const unshieldedWalletSeed = getUnshieldedSeed(SEED);
  const dustWalletSeed = getDustSeed(SEED);

  const unshieldedWalletKeystore = createKeystore(unshieldedWalletSeed, networkId);

  let walletFacade: WalletFacade;

  beforeEach(async () => {
    const shieldedWallet = ShieldedWallet(config).startWithShieldedSeed(shieldedWalletSeed);

    const unshieldedWallet = UnshieldedWallet({
      ...config,
      txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedWalletKeystore));

    const dustWallet = DustWallet({
      ...config,
      costParameters: {
        additionalFeeOverhead: 300_000_000_000_000n,
        feeBlocksMargin: 5,
      },
    }).startWithSeed(dustWalletSeed, ledger.LedgerParameters.initialParameters().dust);

    walletFacade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);
    await walletFacade.start(
      ledger.ZswapSecretKeys.fromSeed(shieldedWalletSeed),
      ledger.DustSecretKey.fromSeed(dustWalletSeed),
    );
  });

  afterEach(async () => {
    await walletFacade.stop();
  });

  it('builds wallet from mnemonic and queries state', async () => {
    await waitForFullySynced(walletFacade);

    const state = await rx.firstValueFrom(walletFacade.state());

    const shieldedAddress = await walletFacade.shielded.getAddress();
    const shieldedAddressStr = ShieldedAddress.codec.encode(networkId, shieldedAddress).asString();
    expect(shieldedAddressStr).toBeTruthy();

    const unshieldedState = await rx.firstValueFrom(walletFacade.unshielded.state);
    const unshieldedAddressStr = UnshieldedAddress.codec.encode(networkId, unshieldedState.address).asString();
    expect(unshieldedAddressStr).toBeTruthy();

    const dustState = await rx.firstValueFrom(walletFacade.dust.state);
    expect(dustState.dustAddress).toBeTruthy();

    console.log('Shielded Address:', shieldedAddressStr);
    console.log('Unshielded Address:', unshieldedAddressStr);
    console.log('Dust Address:', dustState.dustAddress);

    console.log('Shielded coins:', state.shielded.availableCoins.length);
    console.log('Unshielded coins:', state.unshielded.availableCoins.length);
    console.log('Dust coins:', state.dust.availableCoins.length);

    expect(state.isSynced).toBe(true);
  });
});
