import { WalletManager } from './wallet';
import { MessageRouter } from './message-router';
import type { Message } from '@/shared/types/messages';

const wallet = new WalletManager();
const router = new MessageRouter(wallet);

chrome.runtime.onInstalled.addListener(async () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Nocturne.cash installed');
  }
  await wallet.initialize();
});

chrome.runtime.onStartup.addListener(async () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Nocturne.cash started');
  }
  await wallet.initialize();
});

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string' || !message.id) {
    sendResponse({ success: false, error: 'Invalid message format', id: '' });
    return false;
  }

  router
    .handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
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
