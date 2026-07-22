'use client';

// Meta Pixel 的 client-safe 封装（track / pageview）。无同意门控：按 Meta 规格无条件加载 + 打点。
// Pixel ID 抽在无 `'use client'` 的 fbpixel.constants.ts —— Server Component 也要用（layout 的
// noscript 兜底像素），不能让它跨 RSC 边界退化成 client-reference 代理。这里 re-export 供
// client 组件继续从 `@/lib/fbpixel` 取用。

import { FB_PIXEL_ID } from './fbpixel.constants';

export { FB_PIXEL_ID };

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** 上报一次 PageView（SPA 路由切换用）。fbq 未就绪时静默（track 内部已判空）。 */
export function pageview(): void {
  track('PageView');
}

/**
 * 上报标准事件。fbq 就绪即发（无同意门控）。
 * event 用 Meta 标准事件名（ViewContent / InitiateCheckout / Donate / Lead / Contact）。
 */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', event, params);
}
