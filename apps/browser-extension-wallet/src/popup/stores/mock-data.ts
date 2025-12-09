export interface Token {
  symbol: string;
  name: string;
  balance: string;
  usd: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  token: string;
  address: string;
  time: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface Wallet {
  address: string;
  balances: {
    shielded: { amount: string; usd: string };
    unshielded: { token: string; amount: string; usd: string };
    dust: { amount: string; usd: string };
  };
  totalUsd: string;
}

export const mockWallet: Wallet = {
  address: 'mn_shield1qw8h3xtd7gfkx9fkrj4vyxh3tzwecmd53q0lwc9z',
  balances: {
    shielded: { amount: '500', usd: '500.00' },
    unshielded: { token: 'NIGHT', amount: '1000', usd: '1000.00' },
    dust: { amount: '50.5', usd: '0.00' },
  },
  totalUsd: '$1,500.00',
};

export const mockTokens: Token[] = [
  { symbol: 'NIGHT', name: 'Night Token', balance: '1000', usd: '$1,000.00', icon: '🌙' },
  { symbol: 'tDUST', name: 'Test Dust', balance: '50.5', usd: '$0.00', icon: '✨' },
];

export const mockActivity: Transaction[] = [
  {
    id: '1',
    type: 'send',
    amount: '100',
    token: 'NIGHT',
    address: 'mn_shield1abc...xyz',
    time: '2h ago',
    status: 'confirmed',
  },
  {
    id: '2',
    type: 'receive',
    amount: '500',
    token: 'NIGHT',
    address: 'mn_shield1xyz...abc',
    time: '1d ago',
    status: 'confirmed',
  },
  {
    id: '3',
    type: 'send',
    amount: '25',
    token: 'tDUST',
    address: 'mn_shield1def...ghi',
    time: '2d ago',
    status: 'confirmed',
  },
];

export const mockAccounts = [
  { id: '1', name: 'Account 1', address: 'mn_shield1qw8h3xtd7gfkx9fkrj4vyxh3tzwecmd53q0lwc9z' },
  { id: '2', name: 'Account 2', address: 'mn_shield1abc123def456ghi789jkl0mnopqrstuvwxyz123' },
];

export const mockNetworks = [
  { id: 'devnet', name: 'Devnet', status: 'active' },
  { id: 'testnet', name: 'Testnet', status: 'active' },
  { id: 'mainnet', name: 'Mainnet', status: 'coming-soon' },
];

export const mockConnectedSites = [
  { url: 'https://midnight.app', name: 'Midnight App', connectedAt: '2024-01-15' },
  { url: 'https://example-dapp.com', name: 'Example DApp', connectedAt: '2024-01-10' },
];
