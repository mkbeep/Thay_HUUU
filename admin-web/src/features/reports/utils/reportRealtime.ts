export const REPORT_UPDATED_EVENT = 'report:updated';
const STORAGE_KEY = 'restaurant:report-updated';

type ReportUpdatedPayload = {
  reason?: string;
  orderId?: string;
  at?: number;
};

export function broadcastReportUpdated(payload: ReportUpdatedPayload = {}) {
  const message = { ...payload, at: Date.now() };

  window.dispatchEvent(new CustomEvent(REPORT_UPDATED_EVENT, { detail: message }));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
  } catch {
    // ignore storage failures
  }

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(REPORT_UPDATED_EVENT);
    channel.postMessage(message);
    channel.close();
  }
}

export function subscribeReportUpdated(handler: () => void) {
  const onCustomEvent = () => handler();
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) handler();
  };
  const channel =
    'BroadcastChannel' in window ? new BroadcastChannel(REPORT_UPDATED_EVENT) : null;
  const onBroadcast = () => handler();

  window.addEventListener(REPORT_UPDATED_EVENT, onCustomEvent);
  window.addEventListener('storage', onStorage);
  channel?.addEventListener('message', onBroadcast);

  return () => {
    window.removeEventListener(REPORT_UPDATED_EVENT, onCustomEvent);
    window.removeEventListener('storage', onStorage);
    channel?.removeEventListener('message', onBroadcast);
    channel?.close();
  };
}
