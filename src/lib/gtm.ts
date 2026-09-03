type WindowWithDataLayer = Window & {
  dataLayer?: Record<string, any>[];
};

declare const window: WindowWithDataLayer;

export const sendGTMEvent = (eventData: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventData);
  }
};
