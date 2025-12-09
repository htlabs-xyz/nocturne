# DApp Connect Patterns for Browser Extension Wallets

## Overview

Browser extension wallets implement standardized connection patterns to interact with decentralized applications (DApps). The primary standards are **EIP-1193** (Ethereum Provider API) and **EIP-6963** (Multi-Wallet Discovery), with **WalletConnect** providing an alternative for mobile/remote scenarios.

## 1. Provider Injection: window.ethereum Pattern

### Traditional Approach (Legacy)
Browser extension wallets inject a provider object at `window.ethereum` that conforms to EIP-1193:

```typescript
interface EIP1193Provider {
  request(args: RequestArguments): Promise<unknown>;
  on(event: string, listener: (...args: any[]) => void): void;
  removeListener(event: string, listener: (...args: any[]) => void): void;
}

interface RequestArguments {
  method: string;
  params?: unknown[];
}
```

### The Multi-Wallet Problem
When multiple wallets are installed, they compete for the single `window.ethereum` slot, causing unpredictable behavior. The last-loaded wallet overwrites previous providers.

### EIP-6963: Modern Discovery Mechanism
EIP-6963 solves this via event-based discovery without overwriting `window.ethereum`. Wallets announce themselves independently:

```typescript
interface EIP6963ProviderInfo {
  uuid: string;        // UUIDv4 for unique session identification
  name: string;        // Human-readable wallet name
  icon: string;        // Data URI (96x96px minimum)
  rdns: string;        // Reverse domain name (e.g., "com.metamask")
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

// Event interface for wallet announcement
interface EIP6963AnnounceProviderEvent extends Event {
  detail: EIP6963ProviderDetail;
}
```

## 2. EIP-1193: Standard Provider API

### Core Method: `request()`
Primary interface for all RPC communications:

```typescript
// Connection request
const accounts = await provider.request({
  method: 'eth_requestAccounts'
});

// Check existing connection (no prompt)
const connectedAccounts = await provider.request({
  method: 'eth_accounts'
});

// Sign message
const signature = await provider.request({
  method: 'personal_sign',
  params: [message, accounts[0]]
});
```

### Standard Error Codes
```typescript
enum ProviderRpcErrorCode {
  UserRejected = 4001,           // User rejected request
  Unauthorized = 4100,            // Method not authorized
  UnsupportedMethod = 4200,       // Method not supported
  Disconnected = 4900,            // Provider disconnected
  ChainDisconnected = 4901        // Chain disconnected
}

interface ProviderRpcError extends Error {
  code: number;
  message: string;
  data?: unknown;
}
```

## 3. Connection Request Handling

### DApp-Initiated Connection Flow

```typescript
// 1. Detect provider availability
const provider = window.ethereum || window.web3?.currentProvider;

if (!provider) {
  console.log('No wallet detected');
  return;
}

// 2. Request connection (shows wallet UI)
try {
  const accounts = await provider.request({
    method: 'eth_requestAccounts'
  });
  console.log('Connected:', accounts[0]);
} catch (error) {
  if (error.code === 4001) {
    console.log('User rejected connection');
  }
  throw error;
}
```

### EIP-6963 Discovery Pattern

```typescript
// Announce that DApp is ready to connect
window.dispatchEvent(new Event('eip6963:requestProvider'));

// Listen for wallet announcements
const detectedWallets = new Map<string, EIP6963ProviderDetail>();

window.addEventListener('eip6963:announceProvider', (event: any) => {
  const { detail } = event as EIP6963AnnounceProviderEvent;
  detectedWallets.set(detail.info.uuid, detail);
});

// User selects wallet from UI
async function connectToWallet(uuid: string) {
  const walletDetail = detectedWallets.get(uuid);
  if (!walletDetail) return;

  const accounts = await walletDetail.provider.request({
    method: 'eth_requestAccounts'
  });
  return accounts;
}
```

## 4. Permission Management

### Connection Permissions
- **`eth_requestAccounts`** - Explicit user approval required
- **`eth_accounts`** - Returns connected accounts without prompting

### Transaction Permissions
```typescript
// Requires user signature approval
const txHash = await provider.request({
  method: 'eth_sendTransaction',
  params: [{
    from: account,
    to: '0x...',
    value: '0x...',
    data: '0x...'
  }]
});

// Message signing (EIP-191 or EIP-712)
const signature = await provider.request({
  method: 'eth_sign', // or 'personal_sign', 'eth_signTypedData_v4'
  params: [account, messageHash]
});
```

### Scope Management
Modern wallets use wallet-initiated authorization or token-based scopes for fine-grained control over:
- Account read access
- Message signing
- Transaction submission
- Chain switching

## 5. Session Persistence

### Storage Strategy
```typescript
// Store connected state in localStorage
interface SessionData {
  connectedAccount: string;
  chainId: string;
  walletId: string;  // UUID from EIP-6963 or rdns
  timestamp: number;
}

function saveSession(data: SessionData) {
  localStorage.setItem('wallet-session', JSON.stringify(data));
}

function restoreSession(): SessionData | null {
  const stored = localStorage.getItem('wallet-session');
  return stored ? JSON.parse(stored) : null;
}

// Validate session is still active
async function isSessionValid(provider: EIP1193Provider): Promise<boolean> {
  try {
    const accounts = await provider.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch {
    return false;
  }
}
```

### Event Listeners for Session Changes
```typescript
// Account switch
provider.on('accountsChanged', (accounts: string[]) => {
  if (accounts.length === 0) {
    // User disconnected wallet
    clearSession();
  } else {
    // Update to new account
    updateSession({ connectedAccount: accounts[0] });
  }
});

// Chain/network change
provider.on('chainChanged', (chainId: string) => {
  updateSession({ chainId });
  // Consider reloading page for critical applications
});

// Provider connect/disconnect
provider.on('connect', (data: { chainId: string }) => {
  updateSession({ chainId: data.chainId });
});

provider.on('disconnect', (error: ProviderRpcError) => {
  clearSession();
});
```

## 6. RPC Method Handling Patterns

### Routing & Request Queuing
```typescript
interface RPCRequest {
  id: string;
  method: string;
  params: unknown[];
  timestamp: number;
}

class ProviderRequestHandler {
  private requestQueue: Map<string, RPCRequest> = new Map();

  async executeRequest(method: string, params?: unknown[]): Promise<unknown> {
    const id = crypto.randomUUID();
    const request: RPCRequest = { id, method, params: params || [], timestamp: Date.now() };

    this.requestQueue.set(id, request);

    try {
      const result = await this.provider.request({ method, params });
      return result;
    } finally {
      this.requestQueue.delete(id);
    }
  }

  // Batch requests (EIP-2615 compliant)
  async batchRequests(requests: Array<{ method: string; params?: unknown[] }>) {
    return Promise.all(
      requests.map(req => this.executeRequest(req.method, req.params))
    );
  }
}
```

### Common RPC Methods
```typescript
enum CommonRPCMethods {
  // Account/Authorization
  RequestAccounts = 'eth_requestAccounts',
  Accounts = 'eth_accounts',

  // Signing
  PersonalSign = 'personal_sign',
  EthSign = 'eth_sign',
  SignTypedData = 'eth_signTypedData_v4',

  // Transactions
  SendTransaction = 'eth_sendTransaction',
  SignTransaction = 'eth_signTransaction',

  // Read-only
  GetBalance = 'eth_getBalance',
  GetCode = 'eth_getCode',
  Call = 'eth_call',

  // Chain
  ChainId = 'eth_chainId',
  SwitchChain = 'wallet_switchEthereumChain',
  AddChain = 'wallet_addEthereumChain'
}
```

### Error Handling Pattern
```typescript
async function safeRPCCall(
  provider: EIP1193Provider,
  method: string,
  params?: unknown[]
): Promise<any> {
  try {
    return await provider.request({ method, params });
  } catch (error) {
    const err = error as ProviderRpcError;

    switch (err.code) {
      case 4001:
        throw new Error('User rejected the request');
      case 4100:
        throw new Error(`Method '${method}' not authorized`);
      case 4200:
        throw new Error(`Method '${method}' not supported`);
      case 4900:
        throw new Error('Provider disconnected from chain');
      default:
        throw error;
    }
  }
}
```

## WalletConnect Reference

WalletConnect provides an alternative for mobile/remote wallet scenarios:

```typescript
interface WalletConnectSession {
  chainId: number;
  accounts: string[];
}

// Session flow: DApp → QR Code → Mobile Wallet → Approval → Session Established
// Uses encrypted JSON-RPC relay for secure communication
// Supports multi-chain transactions and signing
```

## Key Takeaways

1. **Use EIP-6963 for multi-wallet discovery** (not window.ethereum override)
2. **Implement proper event listeners** for account/chain changes
3. **Store session state with validation** before assuming active connection
4. **Handle all error codes gracefully** with user-friendly messages
5. **Support both extension and WalletConnect** for maximum compatibility
6. **Respect permission boundaries** - don't re-request unnecessary authorizations

## References

- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [EIP-6963: Multi Injected Provider Discovery](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-6963.md)
- [MetaMask Wallet Interoperability](https://docs.metamask.io/wallet/concepts/wallet-interoperability/)
- [Coinbase Wallet Injected Provider](https://docs.cdp.coinbase.com/wallet-sdk/docs/injected-provider)
- [WalletConnect Protocol](https://docs.walletconnect.com)
