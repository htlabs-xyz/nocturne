import { vi } from 'vitest';

const mockStorage: { [key: string]: unknown } = {};
const mockSessionStorage: { [key: string]: unknown } = {};

const chromeStorageLocal = {
  get: vi.fn(async (keys: string | string[] | null) => {
    if (keys === null) return { ...mockStorage };
    if (typeof keys === 'string') return { [keys]: mockStorage[keys] };
    const result: { [key: string]: unknown } = {};
    for (const key of keys) {
      result[key] = mockStorage[key];
    }
    return result;
  }),
  set: vi.fn(async (items: { [key: string]: unknown }) => {
    Object.assign(mockStorage, items);
  }),
  remove: vi.fn(async (keys: string | string[]) => {
    const keysArray = typeof keys === 'string' ? [keys] : keys;
    for (const key of keysArray) {
      delete mockStorage[key];
    }
  }),
  clear: vi.fn(async () => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
  }),
};

const chromeStorageSession = {
  get: vi.fn(async (keys: string | string[] | null) => {
    if (keys === null) return { ...mockSessionStorage };
    if (typeof keys === 'string') return { [keys]: mockSessionStorage[keys] };
    const result: { [key: string]: unknown } = {};
    for (const key of keys) {
      result[key] = mockSessionStorage[key];
    }
    return result;
  }),
  set: vi.fn(async (items: { [key: string]: unknown }) => {
    Object.assign(mockSessionStorage, items);
  }),
  remove: vi.fn(async (keys: string | string[]) => {
    const keysArray = typeof keys === 'string' ? [keys] : keys;
    for (const key of keysArray) {
      delete mockSessionStorage[key];
    }
  }),
  clear: vi.fn(async () => {
    for (const key of Object.keys(mockSessionStorage)) {
      delete mockSessionStorage[key];
    }
  }),
};

const chromeRuntime = {
  onInstalled: {
    addListener: vi.fn(),
  },
  onStartup: {
    addListener: vi.fn(),
  },
  onMessage: {
    addListener: vi.fn(),
  },
};

const chromeAlarms = {
  create: vi.fn(),
  onAlarm: {
    addListener: vi.fn(),
  },
};

const chromeWindows = {
  create: vi.fn((_options, callback?: (window?: chrome.windows.Window) => void) => {
    if (callback) {
      callback({ id: 1 } as chrome.windows.Window);
    }
  }),
  onRemoved: {
    addListener: vi.fn(),
  },
};

global.chrome = {
  storage: {
    local: chromeStorageLocal,
    session: chromeStorageSession,
    sync: chromeStorageLocal,
    onChanged: { addListener: vi.fn() },
  },
  runtime: chromeRuntime,
  alarms: chromeAlarms,
  windows: chromeWindows,
} as unknown as typeof chrome;

let mockKeyCounter = 0;
const mockKeys = new Map<number, { password: string; salt: string }>();

const mockCryptoSubtle = {
  importKey: vi.fn(async () => {
    return { type: 'secret', extractable: false, algorithm: { name: 'PBKDF2' }, usages: ['deriveKey'] };
  }),
  deriveKey: vi.fn(async (algorithm: Pbkdf2Params, _baseKey: CryptoKey) => {
    const keyId = ++mockKeyCounter;
    const saltArray = new Uint8Array(algorithm.salt as ArrayBuffer);
    mockKeys.set(keyId, {
      password: 'mock',
      salt: Array.from(saltArray).join(','),
    });
    return {
      type: 'secret',
      extractable: false,
      algorithm: { name: 'AES-GCM', length: 256 },
      usages: ['encrypt', 'decrypt'],
      _keyId: keyId,
    };
  }),
  encrypt: vi.fn(async (_algorithm: AesGcmParams, _key: CryptoKey, data: BufferSource) => {
    const dataArray = new Uint8Array(data as ArrayBuffer);
    const encoded = new Uint8Array(dataArray.length + 16);
    encoded.set(dataArray, 0);
    for (let i = 0; i < 16; i++) {
      encoded[dataArray.length + i] = i;
    }
    return encoded.buffer;
  }),
  decrypt: vi.fn(async (_algorithm: AesGcmParams, _key: CryptoKey, data: BufferSource) => {
    const dataArray = new Uint8Array(data as ArrayBuffer);
    return dataArray.slice(0, dataArray.length - 16).buffer;
  }),
};

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: mockCryptoSubtle,
    getRandomValues: <T extends ArrayBufferView>(array: T): T => {
      const bytes = array as unknown as Uint8Array;
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    randomUUID: () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  },
  writable: true,
});

export function clearMockStorage() {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }
  for (const key of Object.keys(mockSessionStorage)) {
    delete mockSessionStorage[key];
  }
  mockKeyCounter = 0;
  mockKeys.clear();
}
