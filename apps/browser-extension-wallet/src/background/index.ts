import { WalletManager } from './wallet';
import { MessageRouter } from './message-router';
import type { Message } from '@/shared/types/messages';

const wallet = new WalletManager();
const router = new MessageRouter(wallet);

let isInitialized = false;

async function ensureInitialized(): Promise<void> {
  if (!isInitialized) {
    console.log('[Background] Initializing wallet...');
    await wallet.initialize();
    isInitialized = true;
    console.log('[Background] Wallet initialized');
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Nocturne.cash installed');
  }
  await ensureInitialized();
});

chrome.runtime.onStartup.addListener(async () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Nocturne.cash started');
  }
  await ensureInitialized();
});

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);

  if (!message || typeof message.type !== 'string' || !message.id) {
    sendResponse({ success: false, error: 'Invalid message format', id: '' });
    return false;
  }

  ensureInitialized()
    .then(() => router.handleMessage(message, sender))
    .then((response) => {
      console.log('[Background] Sending response for:', message.type);
      sendResponse(response);
    })
    .catch((error) => {
      console.error('[Background] Error handling message:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
        id: message.id,
      });
    });

  return true;
});

chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    if (wallet.isUnlocked && process.env.NODE_ENV !== 'production') {
      console.log('Service worker keep-alive ping');
    }
  }
});
