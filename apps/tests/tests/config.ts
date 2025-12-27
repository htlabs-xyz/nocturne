import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';

export const networkId = NetworkId.NetworkId.Preview;

export const network = {
  indexerHttp: 'https://indexer.preview.midnight.network/api/v3/graphql',
  indexerWs: 'wss://indexer.preview.midnight.network/api/v3/graphql/ws',
  nodeHttp: 'https://rpc.preview.midnight.network',
  nodeWs: 'wss://rpc.preview.midnight.network',
  proofServer: 'https://lace-proof-pub.preview.midnight.network',
};

export const config = {
  indexerClientConnection: {
    indexerHttpUrl: network.indexerHttp,
    indexerWsUrl: network.indexerWs,
  },
  provingServerUrl: new URL(network.proofServer),
  relayURL: new URL(network.nodeWs),
  networkId: networkId,
};

export const MNEMONIC_1 =
  'flight you bring social unfold fun bubble talk worry source quiz lock shine cushion other bus elite lazy spend yellow drastic east dentist review';

export const MNEMONIC_2 =
  'flight you bring social unfold fun bubble talk worry source quiz lock shine cushion other bus elite lazy spend yellow drastic east dentist review';

export function formatAmount(value: bigint, decimals: number = 6): string {
  const str = value.toString();
  if (str.length <= decimals) {
    return `0.${str.padStart(decimals, '0')}`;
  }
  const intPart = str.slice(0, -decimals);
  const decPart = str.slice(-decimals);
  return `${intPart}.${decPart}`;
}
