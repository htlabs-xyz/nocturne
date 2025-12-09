interface MidnightMessage {
  source: 'midnight-dapp';
  type: string;
  payload?: unknown;
}

function isValidMidnightMessage(data: unknown): data is MidnightMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.source === 'midnight-dapp' &&
    typeof msg.type === 'string' &&
    msg.type.length > 0 &&
    msg.type.length < 100
  );
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return;
  if (!isValidMidnightMessage(event.data)) return;

  chrome.runtime.sendMessage(event.data).catch(() => {});
});
