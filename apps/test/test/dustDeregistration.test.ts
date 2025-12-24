// This file is part of MIDNIGHT-WALLET-SDK.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import * as ledger from '@midnight-ntwrk/ledger-v6';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getShieldedSeed, getUnshieldedSeed, getDustSeed, waitForFullySynced, mnemonicToHexSeed } from './utils.js';
import {
  createKeystore,
  PublicKey,
  InMemoryTransactionHistoryStorage,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import * as rx from 'rxjs';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { config, MNEMONIC_1 } from './config';

vi.setConfig({ testTimeout: 200_000, hookTimeout: 120_000 });

describe('Dust Deregistration', () => {
  const SEED = mnemonicToHexSeed(MNEMONIC_1);

  const shieldedWalletSeed = getShieldedSeed(SEED);
  const unshieldedWalletSeed = getUnshieldedSeed(SEED);
  const dustWalletSeed = getDustSeed(SEED);

  const unshieldedWalletKeystore = createKeystore(unshieldedWalletSeed, NetworkId.NetworkId.Undeployed);

  let walletFacade: WalletFacade;

  beforeEach(async () => {
    const Shielded = ShieldedWallet(config);
    const shieldedWallet = Shielded.startWithShieldedSeed(shieldedWalletSeed);

    const Dust = DustWallet({
      ...config,
      costParameters: {
        additionalFeeOverhead: 300_000_000_000_000n,
        feeBlocksMargin: 5,
      },
    });
    const dustParameters = ledger.LedgerParameters.initialParameters().dust;
    const dustWallet = Dust.startWithSeed(dustWalletSeed, dustParameters);

    const unshieldedWallet = UnshieldedWallet({
      ...config,
      txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedWalletKeystore));

    walletFacade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);

    await walletFacade.start(
      ledger.ZswapSecretKeys.fromSeed(shieldedWalletSeed),
      ledger.DustSecretKey.fromSeed(dustWalletSeed),
    );
  });

  afterEach(async () => {
    await walletFacade.stop();
  });

  it('deregisters from dust generation', async () => {
    // NOTE: by default, our test account is already registered for Dust generation
    await waitForFullySynced(walletFacade);

    const walletStateWithNight = await rx.firstValueFrom(
      walletFacade.state().pipe(rx.filter((s) => s.unshielded.availableCoins.length > 0)),
    );

    const availableCoins = walletStateWithNight.dust.availableCoinsWithFullInfo(new Date());
    expect(availableCoins.every((availableCoins) => availableCoins.dtime === undefined)).toBeTruthy();

    const nightUtxos = walletStateWithNight.unshielded.availableCoins.filter(
      (coin) => coin.meta.registeredForDustGeneration === true,
    );

    const deregisterTokens = 2;
    const dustDeregistrationRecipe = await walletFacade.deregisterFromDustGeneration(
      nightUtxos.slice(0, deregisterTokens),
      unshieldedWalletKeystore.getPublicKey(),
      (payload) => unshieldedWalletKeystore.signData(payload),
    );

    const balancedTransactionRecipe = await walletFacade.balanceTransaction(
      ledger.ZswapSecretKeys.fromSeed(shieldedWalletSeed),
      ledger.DustSecretKey.fromSeed(dustWalletSeed),
      dustDeregistrationRecipe.transaction,
      new Date(Date.now() + 30 * 60 * 1000),
    );

    if (balancedTransactionRecipe.type !== 'TransactionToProve') {
      throw new Error('Expected a transaction to prove');
    }

    // NOTE: we don't sign the transaction via "walletFacade.signTransaction" as
    // the (de)registerFromDustGeneration method already adds the required signatures
    const finalizedDustTx = await walletFacade.finalizeTransaction(balancedTransactionRecipe);
    const dustDeregistrationTxHash = await walletFacade.submitTransaction(finalizedDustTx);

    expect(dustDeregistrationTxHash).toBeTypeOf('string');

    const newWalletState = await rx.firstValueFrom(
      walletFacade
        .state()
        .pipe(
          rx.filter((s) => s.unshielded.availableCoins.some((coin) => coin.meta.registeredForDustGeneration === false)),
        ),
    );

    const availableCoinsWithInfo = newWalletState.dust.availableCoinsWithFullInfo(new Date());
    expect(availableCoinsWithInfo.filter((coin) => coin.dtime !== undefined).length).toBe(deregisterTokens);
  });
});
