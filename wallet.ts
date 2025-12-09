import { WalletBuilder } from '@midnight-ntwrk/wallet';
import {
  MidnightBech32m,
  ShieldedAddress,
  ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import { generateMnemonicWords, HDWallet, joinMnemonicWords, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { NetworkId, SecretKeys } from '@midnight-ntwrk/zswap';
import { mnemonicToSeed } from '@scure/bip39';

const mnemonicWords = generateMnemonicWords();
const mnemonic =
  'crisp weird number execute lobster when armor trial shell forget enlist spoon scatter valve better scale coil spend orbit gift just crawl property forget'; //joinMnemonicWords(mnemonicWords);

console.log('Mnemonic:', mnemonic);
const seed = await mnemonicToSeed(mnemonic);
console.log('Seed from Mnemonic:', Buffer.from(seed).toString('hex'));
const generatedWallet = HDWallet.fromSeed(seed);

if (generatedWallet.type != 'seedOk') {
  throw new Error('Error initializing HD Wallet');
}

const zswapKey = generatedWallet.hdWallet.selectAccount(0).selectRole(Roles.Zswap).deriveKeyAt(0);

const walletSeed =
  zswapKey.type === 'keyDerived'
    ? zswapKey.key
    : (() => {
        throw new Error('Error deriving key');
      })();

const walletSeedHex = Buffer.from(walletSeed).toString('hex');
console.log('Derived Wallet Seed Hex:', walletSeedHex); //f9d74c22817fa7ed6ae3f252751a440a4ce971e131e5f3bd1380c3a7941c9683

const secretKeys = SecretKeys.fromSeed(walletSeed);
console.log('coinPublicKey:', secretKeys.coinPublicKey);
console.log('encryptionPublicKey:', secretKeys.encryptionPublicKey);
console.log('coinSecretKey:', secretKeys.coinSecretKey);
console.log('encryptionSecretKey:', secretKeys.encryptionSecretKey);

const address = new ShieldedAddress(
  new ShieldedCoinPublicKey(Buffer.from(secretKeys.coinPublicKey, 'hex')),
  new ShieldedEncryptionPublicKey(Buffer.from(secretKeys.encryptionPublicKey, 'hex')),
);
console.log('address', address);
const encodedAddress: string = ShieldedAddress.codec.encode('test', address).asString();

console.log('encodedAddress', encodedAddress);

const parsedAddress: MidnightBech32m = MidnightBech32m.parse(encodedAddress);

console.log('parsedAddress', parsedAddress.asString());

const decodedAddress: ShieldedAddress = ShieldedAddress.codec.decode('test', parsedAddress);

console.log('coinPublicKey', decodedAddress.coinPublicKeyString());
console.log('encryptionPublicKey', decodedAddress.encryptionPublicKeyString());
const wallet = await WalletBuilder.build(
  'https://indexer.testnet-02.midnight.network/api/v1/graphql', // Indexer URL
  'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws', // Indexer WebSocket URL
  'https://lace-dev.proof-pub.stg.midnight.tools', // Proving Server URL
  'https://rpc.testnet-02.midnight.network', // Node URL
  walletSeedHex, // Seed
  2,
  'error', // LogLevel
);
// wallet.start();
// const state = await wallet.state();

// console.log("Wallet State:", state);

// wallet.state().subscribe((state) => {
//   console.log(state);
// });
