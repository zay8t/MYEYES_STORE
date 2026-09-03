export interface GrecaptchaExecuteOptions {
  action: string;
}

export interface Grecaptcha {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: GrecaptchaExecuteOptions) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

export {};
