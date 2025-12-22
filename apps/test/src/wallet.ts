import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import * as ledger from '@midnight-ntwrk/ledger-v6';

export interface WalletKeys {
  shieldedSeed: Uint8Array;
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  unshieldedExternalSeed: Uint8Array;
  unshieldedInternalSeed: Uint8Array;
  dustSeed: Uint8Array;
  dustSecretKey: ledger.DustSecretKey;
  metadataSeed: Uint8Array;
}

export function generateMnemonic(strength: number = 256): string {
  return bip39.generateMnemonic(english, strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic, english);
}

export function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Uint8Array {
  return bip39.mnemonicToSeedSync(mnemonic, passphrase);
}

export function deriveWalletKeys(mnemonic: string, account: number = 0, index: number = 0): WalletKeys {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }

  const seed = mnemonicToSeed(mnemonic);
  const hdResult = HDWallet.fromSeed(seed);

  if (hdResult.type !== 'seedOk') {
    throw new Error('Failed to create HD wallet from seed');
  }

  const hdWallet = hdResult.hdWallet;
  const accountKey = hdWallet.selectAccount(account);

  const allRoles = [
    Roles.NightExternal,
    Roles.NightInternal,
    Roles.Dust,
    Roles.Zswap,
    Roles.Metadata,
  ] as const;

  const keysResult = accountKey.selectRoles(allRoles).deriveKeysAt(index);

  if (keysResult.type !== 'keysDerived') {
    throw new Error(`Failed to derive keys for roles: ${keysResult.roles.join(', ')}`);
  }

  const keys = keysResult.keys;

  const shieldedSeed = keys[Roles.Zswap];
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(shieldedSeed);

  const dustSeed = keys[Roles.Dust];
  const dustSecretKey = ledger.DustSecretKey.fromSeed(dustSeed);

  hdWallet.clear();

  return {
    shieldedSeed,
    shieldedSecretKeys,
    unshieldedExternalSeed: keys[Roles.NightExternal],
    unshieldedInternalSeed: keys[Roles.NightInternal],
    dustSeed,
    dustSecretKey,
    metadataSeed: keys[Roles.Metadata],
  };
}

export function printWalletInfo(keys: WalletKeys): void {
  console.log('=== Wallet Keys Derived ===');
  console.log(`Shielded seed: ${Buffer.from(keys.shieldedSeed).toString('hex').slice(0, 16)}...`);
  console.log(`Dust seed: ${Buffer.from(keys.dustSeed).toString('hex').slice(0, 16)}...`);
  console.log(`Unshielded external: ${Buffer.from(keys.unshieldedExternalSeed).toString('hex').slice(0, 16)}...`);
  console.log(`Unshielded internal: ${Buffer.from(keys.unshieldedInternalSeed).toString('hex').slice(0, 16)}...`);
}
