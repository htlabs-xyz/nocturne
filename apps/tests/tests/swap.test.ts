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
import { getShieldedSeed, getUnshieldedSeed, getDustSeed, tokenValue, waitForFullySynced, mnemonicToHexSeed } from './utils.js';
import {
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
  createKeystore,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import * as rx from 'rxjs';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { ShieldedAddress, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { WalletFacade, type CombinedSwapInputs, type CombinedSwapOutputs } from '@midnight-ntwrk/wallet-sdk-facade';
import { config, MNEMONIC_1, MNEMONIC_2 } from './config.js';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';

vi.setConfig({ testTimeout: 200_000, hookTimeout: 120_000 });

describe('Swaps', () => {
  const walletASeed = mnemonicToHexSeed(MNEMONIC_1);
  const walletBSeed = mnemonicToHexSeed(MNEMONIC_2);

  const shieldedWalletASeed = getShieldedSeed(walletASeed);
  const shieldedWalletBSeed = getShieldedSeed(walletBSeed);

  const unshieldedWalletASeed = getUnshieldedSeed(walletASeed);
  const unshieldedWalletBSeed = getUnshieldedSeed(walletBSeed);

  const dustWalletASeed = getDustSeed(walletASeed);
  const dustWalletBSeed = getDustSeed(walletBSeed);

  const unshieldedWalletAKeystore = createKeystore(unshieldedWalletASeed, NetworkId.NetworkId.Undeployed);
  const unshieldedWalletBKeystore = createKeystore(unshieldedWalletBSeed, NetworkId.NetworkId.Undeployed);

  let walletAFacade: WalletFacade;
  let walletBFacade: WalletFacade;

  beforeEach(async () => {
    const Shielded = ShieldedWallet(config);
    const shieldedWalletA = Shielded.startWithShieldedSeed(shieldedWalletASeed);
    const shieldedWalletB = Shielded.startWithShieldedSeed(shieldedWalletBSeed);

    const unshieldedWalletA = UnshieldedWallet({
      ...config,
      txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedWalletAKeystore));

    const unshieldedWalletB = UnshieldedWallet({
      ...config,
      txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedWalletBKeystore));

    const Dust = DustWallet({
      ...config,
      costParameters: {
        additionalFeeOverhead: 900_000_000_000_000n,
        feeBlocksMargin: 5,
      },
    });
    const dustParameters = ledger.LedgerParameters.initialParameters().dust;
    const dustWalletA = Dust.startWithSeed(dustWalletASeed, dustParameters);
    const dustWalletB = Dust.startWithSeed(dustWalletBSeed, dustParameters);

    walletAFacade = new WalletFacade(shieldedWalletA, unshieldedWalletA, dustWalletA);
    walletBFacade = new WalletFacade(shieldedWalletB, unshieldedWalletB, dustWalletB);

    await Promise.all([
      walletAFacade.start(
        ledger.ZswapSecretKeys.fromSeed(shieldedWalletASeed),
        ledger.DustSecretKey.fromSeed(dustWalletASeed),
      ),
      walletBFacade.start(
        ledger.ZswapSecretKeys.fromSeed(shieldedWalletBSeed),
        ledger.DustSecretKey.fromSeed(dustWalletBSeed),
      ),
    ]);
  });

  afterEach(async () => {
    await Promise.all([walletAFacade.stop(), walletBFacade.stop()]);
  });

  it('can perform a shielded swap', async () => {
    await Promise.all([waitForFullySynced(walletAFacade), waitForFullySynced(walletBFacade)]);

    const { shielded: walletAShieldedStateBefore } = await rx.firstValueFrom(walletAFacade.state());
    const { shielded: walletBShieldedStateBefore } = await rx.firstValueFrom(walletBFacade.state());

    const nativeShieldedTokenType = '0000000000000000000000000000000000000000000000000000000000000002';
    const nativeShieldedTokenAmount = tokenValue(10n);

    const shieldedTokenType = ledger.shieldedToken().raw;
    const shieldedTokenAmount = tokenValue(10n);

    const ttl = new Date(Date.now() + 60 * 60 * 1000);

    const shieldedWalletAAddress = ShieldedAddress.codec
      .encode(NetworkId.NetworkId.Undeployed, await walletAFacade.shielded.getAddress())
      .asString();

    const desiredInputs: CombinedSwapInputs = {
      shielded: {
        [shieldedTokenType]: shieldedTokenAmount,
      },
    };

    const desiredOutputs: CombinedSwapOutputs[] = [
      {
        type: 'shielded',
        outputs: [
          {
            type: nativeShieldedTokenType,
            amount: nativeShieldedTokenAmount,
            receiverAddress: shieldedWalletAAddress,
          },
        ],
      },
    ];

    const swapTx = await walletAFacade.initSwap(
      ledger.ZswapSecretKeys.fromSeed(shieldedWalletASeed),
      desiredInputs,
      desiredOutputs,
      ttl,
    );

    const finalizedSwapTx = await walletAFacade.finalizeTransaction({
      type: 'TransactionToProve',
      transaction: swapTx,
    });

    // assuming the tx is submitted to a dex pool and another wallet (wallet B) picks it up

    const walletBBalancedTx = await walletBFacade.balanceTransaction(
      ledger.ZswapSecretKeys.fromSeed(shieldedWalletBSeed),
      ledger.DustSecretKey.fromSeed(dustWalletBSeed),
      finalizedSwapTx,
      new Date(Date.now() + 60 * 60 * 1000),
    );

    const finalizedTx = await walletBFacade.finalizeTransaction(walletBBalancedTx);

    const txHash = await walletBFacade.submitTransaction(finalizedTx);

    expect(txHash).toBeTypeOf('string');

    await Promise.all([
      rx.firstValueFrom(walletAFacade.state().pipe(rx.filter(({ shielded }) => shielded.pendingCoins.length === 0))),
      rx.firstValueFrom(walletBFacade.state().pipe(rx.filter(({ shielded }) => shielded.pendingCoins.length === 0))),
    ]);

    const { shielded: walletAShieldedStateAfter }: any = await rx.firstValueFrom(walletAFacade.state());
    const { shielded: walletBShieldedStateAfter }: any = await rx.firstValueFrom(walletBFacade.state());

    expect(walletAShieldedStateAfter.balances[shieldedTokenType]).toBe(
      (walletAShieldedStateBefore.balances[shieldedTokenType] ?? 0n) - shieldedTokenAmount,
    );
    expect(walletAShieldedStateAfter.balances[nativeShieldedTokenType]).toBe(
      (walletAShieldedStateBefore.balances[nativeShieldedTokenType] ?? 0n) + nativeShieldedTokenAmount,
    );

    expect(walletBShieldedStateAfter.balances[shieldedTokenType]).toBe(
      (walletBShieldedStateBefore.balances[shieldedTokenType] ?? 0n) + shieldedTokenAmount,
    );
    expect(walletBShieldedStateAfter.balances[nativeShieldedTokenType]).toBe(
      (walletBShieldedStateBefore.balances[nativeShieldedTokenType] ?? 0n) - nativeShieldedTokenAmount,
    );
  });

  /**
   * Disabled due to error validating Transaction: FeeCalculation(OutsideTimeToDismiss { time_to_dismiss: 15.494ms, allowed_time_to_dismiss: 15.000ms, size: 4601 })
   * We'll likely need to allow user to set payments in the fallible section of the transaction in order to avoid the issue above
   */
  it.skip('can perform an unshielded swap', async () => {
    await Promise.all([waitForFullySynced(walletAFacade), waitForFullySynced(walletBFacade)]);

    const ttl = new Date(Date.now() + 60 * 60 * 1000);

    const { unshielded: walletAUnshieldedStateBefore } = await rx.firstValueFrom(walletAFacade.state());
    const { unshielded: walletBUnshieldedStateBefore } = await rx.firstValueFrom(walletBFacade.state());

    const unshieldedTokenType = ledger.unshieldedToken().raw;
    const swapAmount = 1n;
    const swapForAmount = 2n;

    const desiredInputs: CombinedSwapInputs = {
      unshielded: {
        [unshieldedTokenType]: swapAmount,
      },
    };

    const desiredOutputs: CombinedSwapOutputs[] = [
      {
        type: 'unshielded',
        outputs: [
          {
            type: unshieldedTokenType,
            amount: swapForAmount,
            receiverAddress: UnshieldedAddress.codec
              .encode(config.networkId, walletAUnshieldedStateBefore.address)
              .asString(),
          },
        ],
      },
    ];

    const swapTx = await walletAFacade.initSwap(
      ledger.ZswapSecretKeys.fromSeed(shieldedWalletASeed),
      desiredInputs,
      desiredOutputs,
      ttl,
    );

    const signedSwapTx = await walletAFacade.signTransaction(swapTx, (payload) => {
      return unshieldedWalletAKeystore.signData(payload);
    });

    // assuming the tx is added to a pool and wallet B picks it up

    const walletBBalancedTx = await walletBFacade.balanceTransaction(
      ledger.ZswapSecretKeys.fromSeed(shieldedWalletBSeed),
      ledger.DustSecretKey.fromSeed(dustWalletBSeed),
      signedSwapTx,
      ttl,
    );

    if (walletBBalancedTx.type !== 'TransactionToProve') {
      throw new Error('Expected TransactionToProve');
    }

    const walletBSignedTx = await walletBFacade.signTransaction(walletBBalancedTx.transaction, (payload) => {
      return unshieldedWalletBKeystore.signData(payload);
    });

    const finalizedTx = await walletBFacade.finalizeTransaction({
      ...walletBBalancedTx,
      transaction: walletBSignedTx,
    });

    const txHash = await walletAFacade.submitTransaction(finalizedTx);

    expect(txHash).toBeTypeOf('string');

    await Promise.all([
      rx.firstValueFrom(
        walletAFacade.state().pipe(rx.filter(({ unshielded }) => unshielded.pendingCoins.length === 0)),
      ),
      rx.firstValueFrom(
        walletBFacade.state().pipe(rx.filter(({ unshielded }) => unshielded.pendingCoins.length === 0)),
      ),
    ]);

    const { unshielded: walletAUnshieldedStateAfter } = await rx.firstValueFrom(walletAFacade.state());
    const { unshielded: walletBUnshieldedStateAfter } = await rx.firstValueFrom(walletBFacade.state());

    expect(walletAUnshieldedStateAfter.balances[unshieldedTokenType]).toBe(
      (walletAUnshieldedStateBefore.balances[unshieldedTokenType] ?? 0n) - swapAmount + swapForAmount,
    );

    expect(walletBUnshieldedStateAfter.balances[unshieldedTokenType]).toBe(
      (walletBUnshieldedStateBefore.balances[unshieldedTokenType] ?? 0n) + swapAmount - swapForAmount,
    );
  });

  it.skip('can perform a combined shielded and unshielded swap', () => {
    throw new Error('Not supported yet. Will be implemented in future PR.');
  });
});
