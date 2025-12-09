const ENCRYPTION_ALGO = 'AES-GCM';
const PBKDF2_ITERATIONS = 100000;

export interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
}

export interface WalletData {
  encryptedWallet: EncryptedData | null;
}

export interface SessionData {
  seed: string | null;
}

export interface ConnectedSitesData {
  connectedSites: string[];
}

function base64Encode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

function base64Decode(data: string): Uint8Array {
  return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

export class StorageManager {
  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
      'deriveKey',
    ]);

    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: ENCRYPTION_ALGO, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptSeed(seed: string, password: string): Promise<EncryptedData> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGO, iv: toArrayBuffer(iv) },
      key,
      new TextEncoder().encode(seed)
    );

    return {
      encrypted: base64Encode(new Uint8Array(encrypted)),
      salt: base64Encode(salt),
      iv: base64Encode(iv),
    };
  }

  async decryptSeed(data: EncryptedData, password: string): Promise<string> {
    const salt = base64Decode(data.salt);
    const iv = base64Decode(data.iv);
    const encrypted = base64Decode(data.encrypted);
    const key = await this.deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGO, iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(encrypted)
    );

    return new TextDecoder().decode(decrypted);
  }

  async saveEncryptedWallet(data: EncryptedData): Promise<void> {
    await chrome.storage.local.set({ encryptedWallet: data });
  }

  async getEncryptedWallet(): Promise<EncryptedData | null> {
    const result = await chrome.storage.local.get('encryptedWallet');
    return result.encryptedWallet ?? null;
  }

  async hasWallet(): Promise<boolean> {
    const wallet = await this.getEncryptedWallet();
    return wallet !== null;
  }

  async saveSessionSeed(seed: string): Promise<void> {
    await chrome.storage.session.set({ seed });
  }

  async getSessionSeed(): Promise<string | null> {
    const result = await chrome.storage.session.get('seed');
    return result.seed ?? null;
  }

  async clearSession(): Promise<void> {
    await chrome.storage.session.clear();
  }

  async saveConnectedSites(sites: string[]): Promise<void> {
    await chrome.storage.local.set({ connectedSites: sites });
  }

  async getConnectedSites(): Promise<string[]> {
    const result = await chrome.storage.local.get('connectedSites');
    return result.connectedSites ?? [];
  }

  async addConnectedSite(origin: string): Promise<void> {
    const sites = await this.getConnectedSites();
    if (!sites.includes(origin)) {
      sites.push(origin);
      await this.saveConnectedSites(sites);
    }
  }

  async removeConnectedSite(origin: string): Promise<void> {
    const sites = await this.getConnectedSites();
    const filtered = sites.filter((s) => s !== origin);
    await this.saveConnectedSites(filtered);
  }

  async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
  }
}
