function injectScript(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inpage.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

injectScript();

interface NocturneRequest {
  type: 'NOCTURNE_REQUEST';
  id: number;
  method: string;
  params?: unknown;
}

function isNocturneRequest(data: unknown): data is NocturneRequest {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === 'NOCTURNE_REQUEST' &&
    typeof msg.id === 'number' &&
    typeof msg.method === 'string'
  );
}

const currentOrigin = window.location.origin;

window.addEventListener('message', async (event: MessageEvent) => {
  if (event.source !== window) return;
  if (event.origin !== currentOrigin) return;
  if (!isNocturneRequest(event.data)) return;

  const { id, method, params } = event.data;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'DAPP_REQUEST',
      payload: { method, params, origin: currentOrigin },
      id: crypto.randomUUID(),
    });

    window.postMessage(
      {
        type: 'NOCTURNE_RESPONSE',
        id,
        result: response.data,
        error: response.error,
      },
      currentOrigin,
    );
  } catch (error) {
    window.postMessage(
      {
        type: 'NOCTURNE_RESPONSE',
        id,
        error: (error as Error).message,
      },
      currentOrigin,
    );
  }
});
