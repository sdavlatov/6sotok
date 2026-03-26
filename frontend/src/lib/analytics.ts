declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export function pushDataLayer(eventName: string, payload?: Record<string, unknown>): void {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...payload });
  }
}
