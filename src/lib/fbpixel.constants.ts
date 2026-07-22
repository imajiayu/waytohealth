// Meta Pixel ID —— 纯常量模块，**不带 `'use client'`**，故 Server Component 与 Client
// Component 都能取到真实字符串值。
//
// 为什么单独抽出来：`fbpixel.ts` 带 `'use client'`；若 Server Component（如 layout.tsx 的
// noscript 兜底像素）从那里 import 常量，跨 RSC 边界拿到的是 client-reference 代理而非字符串，
// 模板字符串插值会得到抛错函数的源码文本。放在无 `'use client'` 的模块里即可绕开这个边界。
//
// Pixel ID 按基金会规格硬编码（公开值，同 utils.ts 的 Stripe publishable key / buy-button ID 做法）。

export const FB_PIXEL_ID = '2211619419407634';
