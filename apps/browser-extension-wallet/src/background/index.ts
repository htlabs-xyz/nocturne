chrome.runtime.onInstalled.addListener(() => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Nocturne.cash installed');
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    if (!message || typeof message.type !== 'string') {
      sendResponse({ error: 'Invalid message format' });
      return false;
    }

    switch (message.type) {
      case 'PING':
        sendResponse({ type: 'PONG' });
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    sendResponse({ error: 'Internal error' });
  }
  return false;
});
