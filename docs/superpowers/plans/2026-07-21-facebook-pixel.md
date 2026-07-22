# Facebook (Meta) Pixel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 waytohealth 前台集成 GDPR 同意门控的 Meta Pixel，追踪 PageView / 捐赠意向 / 表单 Lead。

**Architecture:** 一个 `useSyncExternalStore` 模式的 client-safe consent store 作为单一真源；cookie 同意横幅与 Pixel 加载器都订阅它。未同意前 `fbevents.js` 完全不注入；同意后即时加载并上报。事件通过 client-safe 的 `track()` helper 发送，内部再次校验同意态。

**Tech Stack:** Next.js 16 (App Router) / React 19 / TypeScript / Tailwind v4 / next-intl / `next/script`。无测试框架 —— 每个任务的验证走 `npm run lint`（类型 + lint），最后一个任务做 `npm run build` + 浏览器手动验收。

## Global Constraints

- **验证命令**：本仓库无单测框架，只有 `npm run lint` 与 `npm run build`。每个任务改完跑 `npm run lint`；最终任务跑 `npm run build`。
- **i18n**：禁止硬编码用户可见文案，必须用翻译键（`useTranslations` / `getTranslations`）。`messages/ua.json`（主语言）与 `messages/en.json` 必须同步。品牌名（Way to Health / Meta / Facebook）可硬编码。
- **Admin 排除**：Pixel/横幅只进前台 `src/app/[locale]/layout.tsx`；admin 走独立 `src/app/admin/layout.tsx`，天然不受影响 —— 不要在 admin 挂任何 Pixel。
- **样式**：品牌色用工具类（`gradient-brand` / `shadow-brand-cta` 等），禁止硬编码 hex/inline 品牌色。
- **内部链接**：用 `import { Link } from '@/i18n/navigation'`，禁止原生 `<a>`/Next `<Link>`。
- **Button**：所有 `<button>` 带 `type="button"`。
- **ref 规则**：禁止在渲染期间写 `ref.current`，只能在 `useEffect` 内。
- **环境变量**：`NEXT_PUBLIC_FB_PIXEL_ID`，Next.js 构建期内联 —— 改值需重新构建/部署。缺失时全链路 no-op。
- **事件名（最终）**：`PageView` / `InitiateCheckout`（带 `payment_method`）/ `Lead`（带 `form`）。
- **Commit message 用中文**，结尾附 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。
- 分支：已在 `feat/facebook-pixel`。

---

### Task 1: Consent Store

**Files:**
- Create: `src/lib/consent.ts`

**Interfaces:**
- Produces:
  - `type ConsentState = 'granted' | 'denied' | 'unknown'`
  - `useConsent(): ConsentState` —— React hook（`useSyncExternalStore`）
  - `getConsent(): ConsentState` —— 非 hook 同步读取
  - `setConsent(value: 'granted' | 'denied'): void`
  - `resetConsent(): void`

- [ ] **Step 1: 写文件**

Create `src/lib/consent.ts`：

```typescript
'use client';

import { useSyncExternalStore } from 'react';

// Cookie 同意状态的模块级外部 store（useSyncExternalStore 模式，贴合项目 matchMedia 约定）。
// 三态：'granted'（已接受）/ 'denied'（已拒绝）/ 'unknown'（未决策，横幅需弹出）。
// localStorage 持久化，跨标签页/组件共享。

export type ConsentState = 'granted' | 'denied' | 'unknown';

const STORAGE_KEY = 'wth_cookie_consent';
const listeners = new Set<() => void>();

// 从 localStorage 读快照；SSR / 无 window / localStorage 不可用时返回 'unknown'
function read(): ConsentState {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : 'unknown';
  } catch {
    // 隐私模式 / 禁用 localStorage 时降级
    return 'unknown';
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  listeners.forEach((l) => l());
}

// SSR 快照恒为 'unknown'；客户端 hydration 后 useSyncExternalStore 自动切到真实值
function getServerSnapshot(): ConsentState {
  return 'unknown';
}

/** React hook：订阅同意状态。 */
export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}

/** 非 hook 同步读取（供 track() 等非组件场景）。 */
export function getConsent(): ConsentState {
  return read();
}

/** 写入决策并通知所有订阅者。 */
export function setConsent(value: 'granted' | 'denied'): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // localStorage 写失败时忽略（决策至少在本次会话生效由订阅者内存态兜不住，可接受）
  }
  emit();
}

/** 撤回决策，回到 unknown（横幅重新弹出）。 */
export function resetConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
  emit();
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 无新增 error/warning（空 catch 内均有注释，`no-empty` 通过）。

- [ ] **Step 3: Commit**

```bash
git add src/lib/consent.ts
git commit -m "feat: cookie 同意状态 store（useSyncExternalStore + localStorage）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: FB Pixel Helper

**Files:**
- Create: `src/lib/fbpixel.ts`

**Interfaces:**
- Consumes: `getConsent` from `@/lib/consent` (Task 1)
- Produces:
  - `FB_PIXEL_ID: string | undefined`
  - `PIXEL_ENABLED: boolean`
  - `pageview(): void`
  - `track(event: string, params?: Record<string, unknown>): void`
  - 全局 `Window.fbq?: (...args: unknown[]) => void`

- [ ] **Step 1: 写文件**

Create `src/lib/fbpixel.ts`：

```typescript
'use client';

import { getConsent } from './consent';

// Meta Pixel 的 client-safe 封装。Pixel ID 缺失（未配置）时全部 no-op —— 本地/构建无副作用。

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
export const PIXEL_ENABLED = Boolean(FB_PIXEL_ID);

/** 上报一次 PageView（SPA 路由切换用）。fbq 未就绪时静默。 */
export function pageview(): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}

/**
 * 上报标准/自定义事件。仅在「已同意 + fbq 就绪」时发送，否则静默丢弃。
 * event 用 Meta 标准事件名（InitiateCheckout / Lead ...）。
 */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  if (getConsent() !== 'granted') return;
  window.fbq('track', event, params);
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 通过。`declare global` 在有 `import` 的模块内合法（本文件是 module）。

- [ ] **Step 3: Commit**

```bash
git add src/lib/fbpixel.ts
git commit -m "feat: Meta Pixel client-safe helper（track/pageview，缺 ID 时 no-op）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Pixel Loader Component + Layout Mount

**Files:**
- Create: `src/components/analytics/FacebookPixel.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `useConsent` (Task 1)；`FB_PIXEL_ID` / `PIXEL_ENABLED` / `pageview` (Task 2)
- Produces: `<FacebookPixel />`（default export，无 props）

- [ ] **Step 1: 写加载器组件**

Create `src/components/analytics/FacebookPixel.tsx`：

```tsx
'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useConsent } from '@/lib/consent';
import { FB_PIXEL_ID, PIXEL_ENABLED, pageview } from '@/lib/fbpixel';

// Meta Pixel 加载器：仅「已同意 + 配置了 Pixel ID」时注入 fbevents.js。
// 首帧 PageView 由 base code 触发；SPA 路由切换由 pathname effect 补发（跳过首次防重复计数）。
// 只用 usePathname 不用 useSearchParams —— 后者触发 CSR bailout 会破坏 layout 静态渲染。
export default function FacebookPixel() {
  const consent = useConsent();
  const pathname = usePathname();
  const firstRun = useRef(true);
  const active = PIXEL_ENABLED && consent === 'granted';

  useEffect(() => {
    if (!active) return;
    // 跳过首次：base code 的 fbq('track','PageView') 已覆盖首帧（含刚同意的那一刻）
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    pageview();
  }, [active, pathname]);

  if (!active) return null;

  return (
    <Script id="fb-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FB_PIXEL_ID}');
      fbq('track', 'PageView');`}
    </Script>
  );
}
```

- [ ] **Step 2: 挂载到 layout**

Modify `src/app/[locale]/layout.tsx`：

顶部 import 区加：

```tsx
import FacebookPixel from '@/components/analytics/FacebookPixel';
```

在 `<NextIntlClientProvider ...>` 内、`<Footer />` 之后加 `<FacebookPixel />`：

```tsx
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LoadingBar />
          <Suspense>
            <Navigation />
          </Suspense>
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <FacebookPixel />
        </NextIntlClientProvider>
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 通过。inline `<Script>` 用 `id` + children 是 next/script 官方内联写法。

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/FacebookPixel.tsx src/app/[locale]/layout.tsx
git commit -m "feat: Meta Pixel 加载器 + 挂载前台 layout（同意门控 + SPA PageView）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Consent Banner + Translations + Layout Mount

**Files:**
- Create: `src/components/analytics/CookieConsentBanner.tsx`
- Modify: `messages/en.json`, `messages/ua.json`
- Modify: `src/app/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `useConsent` / `setConsent` (Task 1)；`cookies` 翻译命名空间（本任务新建）
- Produces: `<CookieConsentBanner />`（default export，无 props）

- [ ] **Step 1: 加翻译键（EN）**

Modify `messages/en.json`：在顶层对象末尾（`footer` 之后）加 `cookies` 命名空间：

```json
  "cookies": {
    "title": "Cookie consent",
    "message": "We use cookies and the Meta Pixel to measure traffic and improve your experience. They load only after you accept.",
    "accept": "Accept",
    "decline": "Decline",
    "learnMore": "Privacy Policy",
    "preferences": "Cookie preferences"
  }
```

（注意：在原 `footer` 对象闭合的 `}` 后补 `,` 再加本块，保持 JSON 合法。）

- [ ] **Step 2: 加翻译键（UA）**

Modify `messages/ua.json`：同位置加：

```json
  "cookies": {
    "title": "Згода на cookie",
    "message": "Ми використовуємо файли cookie та Meta Pixel, щоб вимірювати відвідуваність і покращувати ваш досвід. Вони завантажуються лише після вашої згоди.",
    "accept": "Прийняти",
    "decline": "Відхилити",
    "learnMore": "Політика конфіденційності",
    "preferences": "Налаштування cookie"
  }
```

- [ ] **Step 3: 写横幅组件**

Create `src/components/analytics/CookieConsentBanner.tsx`：

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useConsent, setConsent } from '@/lib/consent';

// GDPR cookie 同意横幅：consent 未决策时弹出，Accept/Decline 写决策。
// SSR 与首帧渲染 null（mounted 守卫），避免「静态 HTML 含横幅 → 客户端读到已决策后消失」的闪烁。
export default function CookieConsentBanner() {
  const t = useTranslations('cookies');
  const consent = useConsent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || consent !== 'unknown') return null;

  return (
    <div
      role="dialog"
      aria-label={t('title')}
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-3xl rounded-2xl border border-ukraine-blue-100 bg-white/95 p-4 shadow-[0_8px_32px_rgba(0,108,178,0.16)] backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <p className="flex-1 text-sm leading-relaxed text-ukraine-blue-700">
          {t('message')}{' '}
          <Link
            href="/privacy"
            className="font-semibold text-ukraine-blue-600 underline underline-offset-2 hover:text-ukraine-blue-800"
          >
            {t('learnMore')}
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setConsent('denied')}
            className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-ukraine-blue-500 transition-colors hover:bg-ukraine-blue-50 hover:text-ukraine-blue-700"
          >
            {t('decline')}
          </button>
          <button
            type="button"
            onClick={() => setConsent('granted')}
            className="gradient-brand cursor-pointer rounded-full px-5 py-2 text-sm font-semibold text-white shadow-brand-cta transition-all hover:brightness-[1.08] active:scale-[0.98]"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 挂载到 layout**

Modify `src/app/[locale]/layout.tsx`：顶部 import 加：

```tsx
import CookieConsentBanner from '@/components/analytics/CookieConsentBanner';
```

在 `<FacebookPixel />` 之后加 `<CookieConsentBanner />`（必须在 `NextIntlClientProvider` 内 —— 组件用 `useTranslations`）：

```tsx
          <Footer />
          <FacebookPixel />
          <CookieConsentBanner />
        </NextIntlClientProvider>
```

- [ ] **Step 5: Lint + JSON 校验**

Run: `npm run lint`
Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json'));JSON.parse(require('fs').readFileSync('messages/ua.json'));console.log('json ok')"`
Expected: lint 通过；打印 `json ok`。

- [ ] **Step 6: Commit**

```bash
git add src/components/analytics/CookieConsentBanner.tsx src/app/[locale]/layout.tsx messages/en.json messages/ua.json
git commit -m "feat: cookie 同意横幅（双语 + 门控 Pixel）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Footer 撤回同意入口

**Files:**
- Create: `src/components/layout/CookiePreferencesButton.tsx`
- Modify: `src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: `resetConsent` (Task 1)；`cookies.preferences` 翻译（Task 4 已建）
- Produces: `<CookiePreferencesButton />`（default export，无 props）

- [ ] **Step 1: 写客户端按钮**

Create `src/components/layout/CookiePreferencesButton.tsx`：

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { resetConsent } from '@/lib/consent';

// Footer 里的「Cookie 设置」入口：重置同意让横幅重新弹出（GDPR 撤回同意能力）。
export default function CookiePreferencesButton() {
  const t = useTranslations('cookies');
  return (
    <button
      type="button"
      onClick={() => resetConsent()}
      className="text-xs text-white/45 px-2 py-1 hover:text-white/80 transition-colors sm:text-sm sm:px-3 sm:py-1.5"
    >
      {t('preferences')}
    </button>
  );
}
```

- [ ] **Step 2: 接入 Footer 法律链接区**

Modify `src/components/layout/Footer.tsx`：

顶部 import 区加：

```tsx
import CookiePreferencesButton from './CookiePreferencesButton';
```

把法律链接 `<nav>` 块（`src/components/layout/Footer.tsx:164-178`）替换为下列内容 —— 分隔符改成每个链接后恒显（因为末尾追加了按钮），并在末尾加按钮：

```tsx
              <nav className="order-4 flex flex-wrap items-center -mx-2 sm:mx-0 sm:gap-1 sm:pt-2 lg:order-none">
                {LEGAL_LINKS.map(({ key, href }) => (
                  <span key={key} className="flex items-center">
                    <Link
                      href={href}
                      className="text-xs text-white/45 px-2 py-1 hover:text-white/80 transition-colors sm:text-sm sm:px-3 sm:py-1.5"
                    >
                      {t(key)}
                    </Link>
                    <span className="text-white/15 select-none">·</span>
                  </span>
                ))}
                <CookiePreferencesButton />
              </nav>
```

（注意：删掉了原来的 `, i` 索引参数和 `{i < LEGAL_LINKS.length - 1 && (...)}` 条件 —— 现在每个链接后都跟分隔符，最后一个分隔符后接 cookie 按钮。）

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 通过（`i` 已删除，无 unused var）。

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/CookiePreferencesButton.tsx src/components/layout/Footer.tsx
git commit -m "feat: Footer 加 Cookie 设置入口（撤回同意重弹横幅）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 捐赠意向事件

**Files:**
- Modify: `src/components/projects/donation/useDonationFlow.ts`
- Modify: `src/components/projects/donation/MethodStep.tsx`

**Interfaces:**
- Consumes: `track` (Task 2)

- [ ] **Step 1: Stripe 意向（hook）**

Modify `src/components/projects/donation/useDonationFlow.ts`：

顶部 import 加：

```tsx
import { track } from '@/lib/fbpixel';
```

`goToStripe` 函数首行加埋点：

```tsx
  function goToStripe() {
    track('InitiateCheckout', { payment_method: 'stripe' });
    setDirection('forward');
    setView('stripe');
  }
```

- [ ] **Step 2: monobank 意向（MethodStep）**

Modify `src/components/projects/donation/MethodStep.tsx`：

顶部 import 加：

```tsx
import { track } from '@/lib/fbpixel';
```

monobank `<a>`（`src/components/projects/donation/MethodStep.tsx:44` 起）加 `onClick`：

```tsx
          <a
            href={monobankUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('InitiateCheckout', { payment_method: 'monobank' })}
            className="group relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-ukraine-blue-100 bg-white p-4 transition-all duration-200 hover:border-ukraine-blue-900/50 hover:bg-ukraine-blue-50/40 hover:shadow-[0_4px_16px_rgba(0,108,178,0.1)]"
          >
```

（只加 `onClick` 一行，其余属性/className 不动。）

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 通过。桌面 `DonationSidebar` 与移动端 `MobileDonationSheet`（内部包 `DonationSidebar`）共用此 hook/组件，一处改动覆盖两端。

- [ ] **Step 4: Commit**

```bash
git add src/components/projects/donation/useDonationFlow.ts src/components/projects/donation/MethodStep.tsx
git commit -m "feat: 捐赠意向埋点 InitiateCheckout（Stripe/monobank，带 payment_method）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 表单 Lead 事件

**Files:**
- Modify: `src/components/forms/RequestAssistanceForm.tsx`
- Modify: `src/components/forms/PartnershipForm.tsx`

**Interfaces:**
- Consumes: `track` (Task 2)

- [ ] **Step 1: Assistance 表单**

Modify `src/components/forms/RequestAssistanceForm.tsx`：

顶部 import 加：

```tsx
import { track } from '@/lib/fbpixel';
```

成功分支（`if (res.ok) {` 内、`router.push` 之前）加埋点：

```tsx
      if (res.ok) {
        track('Lead', { form: 'assistance' });
        router.push('/request-assistance/success');
        return;
      }
```

- [ ] **Step 2: Partnership 表单**

Modify `src/components/forms/PartnershipForm.tsx`：

顶部 import 加：

```tsx
import { track } from '@/lib/fbpixel';
```

成功分支（`if (res.ok) {` 内、`router.push('/partnership/success')` 之前）加埋点：

```tsx
      if (res.ok) {
        track('Lead', { form: 'partnership' });
        router.push('/partnership/success');
        return;
      }
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 通过。

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/RequestAssistanceForm.tsx src/components/forms/PartnershipForm.tsx
git commit -m "feat: 表单提交成功埋点 Lead（assistance/partnership）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 隐私政策文案更新（点名 Meta Pixel + 撤回方式）

**Files:**
- Modify: `messages/en.json`（`privacyPage.sections.cookies.0`）
- Modify: `messages/ua.json`（`privacyPage.sections.cookies.0`）

- [ ] **Step 1: EN 文案**

Modify `messages/en.json`：把 `privacyPage.sections.cookies` 的 `"0"` 值替换为：

```json
        "0": "Our website uses cookies and the Meta (Facebook) Pixel to collect statistical information and enhance user experience. Analytics cookies and the Meta Pixel load only after you accept them in the consent banner. You can change or withdraw your consent at any time via the \"Cookie preferences\" link in the site footer, or manage cookies in your browser settings."
```

- [ ] **Step 2: UA 文案**

Modify `messages/ua.json`：把 `privacyPage.sections.cookies` 的 `"0"` 值替换为：

```json
        "0": "Наш сайт використовує файли cookie та Meta (Facebook) Pixel для збору статистичної інформації та покращення користувацького досвіду. Аналітичні cookie та Meta Pixel завантажуються лише після вашої згоди в банері згоди. Ви можете змінити або відкликати згоду будь-коли за посиланням «Налаштування cookie» у нижньому колонтитулі сайту або керувати cookie в налаштуваннях браузера."
```

- [ ] **Step 3: JSON 校验**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json'));JSON.parse(require('fs').readFileSync('messages/ua.json'));console.log('json ok')"`
Expected: 打印 `json ok`。

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/ua.json
git commit -m "docs: 隐私政策 cookie 章节点名 Meta Pixel + 撤回同意方式

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: 环境变量 + 文档

**Files:**
- Modify: `.env.example`
- Modify: `CLAUDE.md`

- [ ] **Step 1: `.env.example`**

Modify `.env.example`：文件末尾追加：

```env

# ── Meta (Facebook) Pixel（前台 analytics；缺失时不加载 Pixel、无追踪行为）──
NEXT_PUBLIC_FB_PIXEL_ID=          # Meta 事件管理器里的纯数字 Pixel ID（形如 1234567890123456）；改值需重新构建/部署
```

- [ ] **Step 2: `CLAUDE.md` 技术栈表**

Modify `CLAUDE.md`：在「已集成」表格末尾加一行：

```
| 分析/追踪 | Meta (Facebook) Pixel | 前台 `[locale]` layout 加载，GDPR 同意门控（`CookieConsentBanner` + `src/lib/consent.ts` 的 `useSyncExternalStore` store）。未同意不注入 `fbevents.js`。事件：PageView / InitiateCheckout（捐赠意向）/ Lead（表单）。ID 走 `NEXT_PUBLIC_FB_PIXEL_ID`，缺失时全链路 no-op。埋点 helper `src/lib/fbpixel.ts` |
```

- [ ] **Step 3: `CLAUDE.md` 环境变量段**

Modify `CLAUDE.md`：在某个环境变量代码块中补一条（放「新闻相关环境变量」块或新起一小段均可）：

```env
# Meta (Facebook) Pixel（前台 analytics，客户端可见，缺失时不加载 Pixel）
NEXT_PUBLIC_FB_PIXEL_ID=          # Meta 事件管理器纯数字 Pixel ID；NEXT_PUBLIC_ 构建期内联，改值需重新部署
```

- [ ] **Step 4: Commit**

```bash
git add .env.example CLAUDE.md
git commit -m "docs: 记录 NEXT_PUBLIC_FB_PIXEL_ID 与 Meta Pixel 集成

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: 最终验证 + 验收

**Files:** 无（仅验证）

- [ ] **Step 1: 构建**

Run: `npm run build`
Expected: 构建成功，无类型错误。因 `.env.local` 未配 `NEXT_PUBLIC_FB_PIXEL_ID`，Pixel 全链路 no-op —— 构建产物不含 `fbevents.js` 引用。

- [ ] **Step 2: Lint 全量**

Run: `npm run lint`
Expected: 通过。

- [ ] **Step 3: 手动验收（本地 dev，需临时在 `.env.local` 填一个测试 Pixel ID）**

启动 `npm run dev`，逐条核对 spec 验收标准：

1. **无 ID 时**：`.env.local` 不含 `NEXT_PUBLIC_FB_PIXEL_ID` → 无横幅追踪行为、Network 无 `fbevents.js`、构建通过。（Step 1 已覆盖。）
2. **有 ID 首访**：横幅出现，Network 无 `fbevents.js`。
3. **点 Accept**：`fbevents.js` 加载，Meta Pixel Helper 显示 PageView；刷新后横幅不再出现。
4. **点 Decline**：无 `fbevents.js`；刷新后横幅不出现。
5. **SPA 路由切换**：每次切换一次 PageView（首帧不重复）。
6. **点 Stripe / monobank 按钮**：InitiateCheckout（带 payment_method）。
7. **表单成功提交**：Lead。
8. **Footer「Cookie preferences」**：横幅重新出现，可改选择。
9. **admin `/admin/*`**：无横幅、无 Pixel。
10. **lint + build 通过**。

> 无法在纯 dev 端到端验证 Meta 服务端接收（需真实 Pixel + Meta Pixel Helper 插件）。至少确认 Network 里 `fbevents.js` 的加载/不加载与 `graph.facebook.com/tr?...ev=PageView` 请求随同意态和路由变化正确出现。

- [ ] **Step 4: 汇报**

如实汇报每条验收结果（含未能验证项）。若全绿，进入 finishing-a-development-branch 决定合并/PR。

---

## Self-Review

**1. Spec coverage（对照 spec 各节）：**
- consent store → Task 1 ✓
- fbpixel helper → Task 2 ✓
- FacebookPixel 组件 + layout 挂载 → Task 3 ✓
- CookieConsentBanner + `cookies` 翻译 + layout 挂载 → Task 4 ✓
- Footer 撤回入口 → Task 5 ✓
- 捐赠意向（Stripe hook + monobank MethodStep） → Task 6 ✓
- 表单 Lead（两表单） → Task 7 ✓
- 隐私政策文案 → Task 8 ✓
- `.env.example` + `CLAUDE.md` → Task 9 ✓
- 验收标准 10 条 → Task 10 ✓

**2. Placeholder scan：** 无 TBD/TODO；每个改动步骤均给出完整代码。

**3. Type consistency：**
- `ConsentState` / `useConsent` / `getConsent` / `setConsent` / `resetConsent`（Task 1）在 Task 2/3/4/5 引用一致。
- `track(event, params?)` / `pageview()` / `FB_PIXEL_ID` / `PIXEL_ENABLED`（Task 2）在 Task 3/6/7 引用一致。
- 事件名 `InitiateCheckout` / `Lead` / `PageView` 与参数键 `payment_method` / `form` 全程一致。
- 翻译命名空间 `cookies`（键 title/message/accept/decline/learnMore/preferences）在 Task 4 定义，Task 5 只用 `preferences`，一致。

## 附：Meta Pixel 创建步骤（交给基金会执行）

1. 登 [business.facebook.com](https://business.facebook.com) → 事件管理器（Events Manager）。
2. 「连接数据源」→ 选「网站」→ 创建像素（Pixel），命名如 `Way to Health`。
3. 拿到纯数字 **Pixel ID**（形如 `1234567890123456`）。
4. Vercel 项目 → Settings → Environment Variables 加 `NEXT_PUBLIC_FB_PIXEL_ID = <ID>`（Production + Preview），本地填 `.env.local`。
5. 重新部署（`NEXT_PUBLIC_` 构建期内联，必须 redeploy 生效）。
6. 安装 Chrome「Meta Pixel Helper」扩展验证 PageView/事件上报。
