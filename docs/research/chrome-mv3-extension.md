# Chrome Extension Manifest V3 Architecture Research

## Executive Summary

Manifest V3 (MV3) replaces MV2's persistent background pages with ephemeral service workers, fundamentally changing extension architecture. This requires redesigning state management, message passing, and long-running connections.

---

## 1. Service Worker vs Background Scripts

### Key Architectural Shift

**MV2**: Persistent background page (always in memory)
**MV3**: Service worker (event-driven, terminates after ~30 seconds inactivity)

### manifest.json Configuration

```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  }
}
```

### Critical Differences

| Aspect | MV2 | MV3 |
|--------|-----|-----|
| Lifecycle | Always running | Starts on event, terminates when idle |
| DOM Access | Yes | No (offscreen docs if needed) |
| Global State | Yes (memory) | No (must use chrome.storage) |
| XMLHttpRequest | Yes | No (use fetch) |
| setTimeout/setInterval | Yes | No (use chrome.alarms) |
| Synchronous APIs | Full support | Limited |

### Service Worker Lifecycle Events

```javascript
// MUST register listeners at top level, NOT in promises
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received');
  return true; // Keep channel open for async response
});

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm fired:', alarm.name);
});
```

**Critical**: Async listener registration (inside promises/callbacks) breaks in MV3.

---

## 2. Message Passing Patterns

### Communication Map

```
┌─────────────┐     chrome.tabs.sendMessage    ┌──────────────────┐
│   Popup     │◄─────────────────────────────►│ Content Script   │
└─────────────┘                                 └──────────────────┘
      │                                                   │
      │ chrome.runtime.sendMessage                       │
      │                                                   │
      ▼                                                   ▼
┌─────────────────────────┐                    (Inspects/modifies DOM)
│  Service Worker         │                    (Limited permissions)
│  (Higher privileges)    │
└─────────────────────────┘
```

### One-Time Messages (Request-Response)

**Content Script → Service Worker**:
```javascript
// content-script.js
chrome.runtime.sendMessage(
  { type: 'GET_DATA', payload: 'example' },
  (response) => {
    console.log('Response:', response);
  }
);
```

**Service Worker Listener**:
```javascript
// service-worker.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_DATA') {
    // Process and respond
    sendResponse({ success: true, data: 'result' });
  }
  return true; // Keep channel open for async operations
});
```

**Popup → Content Script** (requires active tab):
```javascript
// popup.js
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: 'ACTION' }, (response) => {
    console.log(response);
  });
});
```

### Long-Lived Connections (Ports)

For bidirectional, multi-message communication:

```javascript
// content-script.js - Initiator
const port = chrome.runtime.connect({ name: 'stream_connection' });

port.onMessage.addListener((message) => {
  console.log('Received:', message);
});

port.postMessage({ data: 'initial message' });

port.onDisconnect.addListener(() => {
  console.log('Connection closed');
});
```

```javascript
// service-worker.js - Receiver
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'stream_connection') {
    port.onMessage.addListener((message) => {
      // Process message
      port.postMessage({ type: 'ACK', data: message.data });
    });
  }
});
```

### Broadcasting Pattern

Service worker relays popup messages to content scripts:

```javascript
// service-worker.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.broadcast) {
    // Get all tabs and forward message
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, message.data);
      });
    });
    sendResponse({ broadcasted: true });
  }
  return true;
});
```

---

## 3. Storage APIs

### Storage Comparison

| API | Persistence | Size | Thread Safety | Use Case |
|-----|-------------|------|---------------|----------|
| **chrome.storage.local** | Disk (persists) | 10MB | Async | Long-term data, user settings |
| **chrome.storage.session** | Memory (cleared on exit) | 10MB | Async | Temp data, secrets during session |
| **chrome.storage.sync** | Cloud (synced) | 100KB | Async | Cross-device settings |
| **IndexedDB** | Disk | 50MB+ | Async | Large datasets |
| **localStorage** | ❌ Not available in service workers | — | — | Use chrome.storage instead |

### Storage Patterns

**Secure Sensitive Data (crypto keys)**:
```javascript
// Use chrome.storage.session - in-memory, cleared on browser close
chrome.storage.session.set({
  'private_key': encryptedKey, // Pre-encrypt with Web Crypto API
  'session_token': token
}, () => {
  console.log('Sensitive data stored');
});

// Retrieve during session
chrome.storage.session.get(['private_key'], (result) => {
  const decrypted = decryptKey(result.private_key);
});
```

**Persistent User Data**:
```javascript
// Use chrome.storage.local for user preferences
chrome.storage.local.set({
  'user_settings': { theme: 'dark', network: 'mainnet' },
  'address_book': addressList
});
```

**Encryption Pattern**:
```javascript
// Encrypt before storing in chrome.storage.local
async function encryptData(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    key,
    new TextEncoder().encode(plaintext)
  );
  return { cipher, salt };
}
```

### Migration from MV2

MV2 top-level variables are gone:
```javascript
// ❌ MV2 (doesn't work in MV3)
let globalState = {};

// ✅ MV3 - Use session storage
chrome.storage.session.get('globalState', (result) => {
  const state = result.globalState || {};
});
```

---

## 4. Handling Long-Running Connections

### Problem

Service workers terminate ~30 seconds after inactivity, breaking WebSocket connections.

### Solutions

**1. Offscreen Document API** (Chrome 109+, recommended):
```javascript
// service-worker.js
async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const existingContexts = await chrome.offscreen.getDocument();

  if (!existingContexts) {
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ['WORKERS'],
      justification: 'WebSocket connection handler'
    });
  }
}

// offscreen.html - runs longer, maintains connection
<script src="websocket-handler.js"></script>
```

**2. Keep-Alive with Alarms**:
```javascript
// Prevents service worker termination via periodic pings
chrome.alarms.create('keep-alive', { periodInMinutes: 0.1 }); // Every 6 seconds

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keep-alive') {
    // Just wakes the worker; doesn't truly maintain connection
    console.log('Service worker kept alive');
  }
});
```

**3. Content Script WebSocket** (when applicable):
```javascript
// content-script.js - persists as long as page is open
const ws = new WebSocket('wss://api.example.com');
ws.onmessage = (event) => {
  // Forward to service worker
  chrome.runtime.sendMessage({ type: 'WS_MESSAGE', data: event.data });
};
```

**4. Reconnection Strategy** (best practice):
```javascript
class ReliableConnection {
  constructor(url) {
    this.url = url;
    this.reconnectDelay = 1000;
    this.maxDelay = 30000;
  }

  async connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.reconnectDelay = 1000;
    } catch (error) {
      await this.scheduleReconnect();
    }
  }

  async scheduleReconnect() {
    await new Promise(r => setTimeout(r, this.reconnectDelay));
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
    this.connect();
  }
}
```

---

## 5. Security Best Practices for Crypto Wallets

### Private Key Handling

**CRITICAL RULES**:
- ✅ Store encrypted in `chrome.storage.session` during active use
- ✅ Encrypt with Web Crypto API before any persistent storage
- ❌ NEVER log private keys
- ❌ NEVER expose to content scripts unencrypted
- ❌ NEVER store seed phrases in plain text

### Storage Security Hierarchy

```
High Security:
  ↓
1. chrome.storage.session (encrypted) ← Use for active keys
2. chrome.storage.local (encrypted) ← Use for long-term backup only
3. ❌ localStorage
4. ❌ IndexedDB (unencrypted)
5. ❌ Plaintext files
```

### Secure Architecture Example

```javascript
// service-worker.js - Crypto wallet pattern
class SecureWallet {
  #privateKey = null; // Private field, not in storage

  async importKey(encryptedKey, password) {
    // Decrypt from storage into memory only
    const decrypted = await this.decrypt(encryptedKey, password);
    this.#privateKey = decrypted;

    // Never store unencrypted
    chrome.storage.session.set({ wallet_unlocked: true });
  }

  async signTransaction(txn) {
    // Only expose to popup via message, not content scripts
    if (!this.#privateKey) throw new Error('Wallet locked');

    const signature = await this.sign(txn, this.#privateKey);
    return signature; // Return signature, not key
  }

  async lock() {
    this.#privateKey = null;
    chrome.storage.session.remove('wallet_unlocked');
  }

  async decrypt(encryptedData, password) {
    const { cipher, salt, iv } = encryptedData;
    const key = await this.deriveKey(password, salt);

    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    );
  }

  async deriveKey(password, salt) {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    return await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
```

### Content Script Isolation

```javascript
// ✅ Content script - Never expose keys
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SIGN_REQUEST') {
    // Forward to service worker, never handle keys here
    chrome.runtime.sendMessage(
      { type: 'SIGN_TXN', data: message.data },
      sendResponse
    );
    return true;
  }
});

// ❌ BAD - Content script with key access
// const key = await chrome.storage.local.get('privateKey');
// // Exposed to page scripts!
```

### Threat Model

- **Phishing**: Implement popup validation, verify origin in message sender
- **Injection**: Use Content Security Policy (CSP) in manifest
- **State Theft**: Encrypt all sensitive data, use chrome.storage.session

### CSP Configuration

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'",
    "sandbox": "sandbox allow-scripts; script-src 'self'"
  }
}
```

---

## 6. Complete Example: Secure Wallet Extension

### Project Structure
```
extension/
├── manifest.json
├── service-worker.js
├── popup/
│   ├── popup.html
│   └── popup.js
└── content/
    └── content-script.js
```

### manifest.json
```json
{
  "manifest_version": 3,
  "name": "Secure Wallet",
  "version": "1.0.0",
  "permissions": ["storage", "tabs", "runtime"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup/popup.html"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content/content-script.js"],
    "run_at": "document_start"
  }],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### service-worker.js
```javascript
import { SecureWallet } from './wallet.js';

const wallet = new SecureWallet();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'UNLOCK_WALLET':
          await wallet.importKey(message.key, message.password);
          sendResponse({ success: true });
          break;

        case 'SIGN_TRANSACTION':
          if (!sender.url.includes('chrome-extension://')) {
            throw new Error('Unauthorized');
          }
          const signature = await wallet.signTransaction(message.txn);
          sendResponse({ signature });
          break;

        case 'GET_ADDRESS':
          const address = await wallet.getAddress();
          sendResponse({ address });
          break;

        default:
          sendResponse({ error: 'Unknown command' });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  })();

  return true; // Keep channel open for async
});
```

---

## Key Takeaways

1. **Service workers are ephemeral** → All state must be persisted
2. **Message passing is primary IPC** → One-time for simple, ports for streaming
3. **chrome.storage.session for secrets** → Cleared on browser close
4. **Offscreen documents for persistence** → Use for WebSocket/long-running tasks
5. **Encrypt sensitive data** → Web Crypto API mandatory for private keys
6. **Register listeners at top-level** → Async registration breaks in MV3

---

## Resources & References

- [Chrome Extensions MV3 Migrate to Service Workers](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers)
- [Chrome Extensions Message Passing API](https://developer.chrome.com/docs/extensions/mv3/messaging/)
- [Chrome Extensions Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [Chrome Extensions MV3 Storage & Cookies](https://developer.chrome.com/docs/extensions/mv3/storage-and-cookies/)
- [MDN WebExtensions Background](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
