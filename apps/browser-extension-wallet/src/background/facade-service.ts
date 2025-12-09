import { BehaviorSubject, Observable, Subscription, filter } from 'rxjs';
import * as ledger from '@midnight-ntwrk/ledger-v6';
import { WalletFacade, FacadeState } from '@midnight-ntwrk/wallet-sdk-facade';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import {
  createKeystore,
  PublicKey,
  WalletBuilder as UnshieldedWalletBuilder,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import type { WalletBalance } from '@/shared/types/messages';

export const NETWORK_CONFIG = {
  networkId: 'testnet' as const,
  indexerHttp: 'https://indexer-testnet.nocturne.cash/api/v3/graphql',
  indexerWs: 'wss://indexer-testnet.nocturne.cash/api/v3/graphql/ws',
  proofServer: 'https://lace-dev.proof-pub.stg.midnight.tools',
  nodeUrl: 'https://rpc.testnet-02.midnight.network',
};

export interface BalanceState {
  balance: WalletBalance;
  isSynced: boolean;
}

export class FacadeService {
  private facade: WalletFacade | null = null;
  private stateSubscription: Subscription | null = null;
  private balanceSubject = new BehaviorSubject<BalanceState>({
    balance: { shielded: '0', unshielded: '0', dust: '0' },
    isSynced: false,
  });

  get balance$(): Observable<BalanceState> {
    return this.balanceSubject.asObservable();
  }

  get currentBalance(): BalanceState {
    return this.balanceSubject.getValue();
  }

  async start(bip39Seed: Uint8Array): Promise<void> {
    if (this.facade) {
      await this.stop();
    }

    const hdWallet = HDWallet.fromSeed(bip39Seed);
    if (hdWallet.type !== 'seedOk') {
      throw new Error('Failed to initialize HDWallet');
    }

    const derivationResult = hdWallet.hdWallet
      .selectAccount(0)
      .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
      .deriveKeysAt(0);

    if (derivationResult.type !== 'keysDerived') {
      throw new Error('Failed to derive keys');
    }

    hdWallet.hdWallet.clear();

    const zswapSeed = derivationResult.keys[Roles.Zswap];
    const nightSeed = derivationResult.keys[Roles.NightExternal];
    const dustSeed = derivationResult.keys[Roles.Dust];

    const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(zswapSeed);
    const dustSecretKey = ledger.DustSecretKey.fromSeed(dustSeed);

    const shieldedConfig = {
      networkId: NETWORK_CONFIG.networkId,
      indexerClientConnection: {
        indexerHttpUrl: NETWORK_CONFIG.indexerHttp,
        indexerWsUrl: NETWORK_CONFIG.indexerWs,
      },
      provingServerUrl: new URL(NETWORK_CONFIG.proofServer),
      relayURL: new URL(NETWORK_CONFIG.nodeUrl),
    };

    const dustConfig = {
      networkId: NETWORK_CONFIG.networkId,
      indexerClientConnection: {
        indexerHttpUrl: NETWORK_CONFIG.indexerHttp,
        indexerWsUrl: NETWORK_CONFIG.indexerWs,
      },
      costParameters: {
        additionalFeeOverhead: 300_000_000_000_000n,
        feeBlocksMargin: 5,
      },
      provingServerUrl: new URL(NETWORK_CONFIG.proofServer),
      relayURL: new URL(NETWORK_CONFIG.nodeUrl),
    };

    const unshieldedKeystore = createKeystore(nightSeed, NETWORK_CONFIG.networkId);

    const ShieldedWalletClass = ShieldedWallet(shieldedConfig);
    const shieldedWallet = ShieldedWalletClass.startWithSecretKeys(shieldedSecretKeys);

    const DustWalletClass = DustWallet(dustConfig);
    const dustParameters = ledger.LedgerParameters.initialParameters().dust;
    const dustWallet = DustWalletClass.startWithSecretKey(dustSecretKey, dustParameters);

    const unshieldedWallet = await UnshieldedWalletBuilder.build({
      networkId: NETWORK_CONFIG.networkId,
      indexerUrl: NETWORK_CONFIG.indexerWs,
      publicKey: PublicKey.fromKeyStore(unshieldedKeystore),
    });

    this.facade = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);
    await this.facade.start(shieldedSecretKeys, dustSecretKey);

    this.stateSubscription = this.facade.state().subscribe((state: FacadeState) => {
      this.updateBalance(state);
    });
  }

  async stop(): Promise<void> {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
      this.stateSubscription = null;
    }

    if (this.facade) {
      await this.facade.stop();
      this.facade = null;
    }

    this.balanceSubject.next({
      balance: { shielded: '0', unshielded: '0', dust: '0' },
      isSynced: false,
    });
  }

  async waitForSync(timeoutMs = 60000): Promise<BalanceState> {
    if (!this.facade) {
      throw new Error('Facade not started');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Sync timeout'));
      }, timeoutMs);

      const subscription = this.balanceSubject.pipe(filter((state) => state.isSynced)).subscribe((state) => {
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve(state);
      });
    });
  }

  private updateBalance(state: FacadeState): void {
    const shieldedTokenType = (ledger.shieldedToken() as { raw: string }).raw;
    const unshieldedTokenType = (ledger.unshieldedToken() as { raw: string }).raw;

    const shieldedBalance = state.shielded.balances[shieldedTokenType] ?? 0n;
    const unshieldedBalance = state.unshielded.balances.get(unshieldedTokenType) ?? 0n;
    const dustBalance = state.dust.walletBalance(new Date());

    this.balanceSubject.next({
      balance: {
        shielded: shieldedBalance.toString(),
        unshielded: unshieldedBalance.toString(),
        dust: dustBalance.toString(),
      },
      isSynced: state.isSynced,
    });
  }
}
