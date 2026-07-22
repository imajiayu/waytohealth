# Facebook (Meta) Pixel 集成设计

> 日期：2026-07-21
> 状态：已批准，待实现

## 目标

给 waytohealth 前台集成 Meta Pixel，用于衡量投放/流量转化。核心约束是 **GDPR 同意门控**：
面向 EU/国际捐赠者，Pixel 会设第三方追踪 cookie，必须先取得访客同意才加载脚本。

## 需求确认（来自 brainstorming）

- **Pixel ID**：尚未创建。代码走环境变量 `NEXT_PUBLIC_FB_PIXEL_ID` 占位，缺失时整套无害 no-op；ID 由基金会在
  Meta Business 创建后填入 `.env.local` / Vercel。
- **同意门控**：需要 cookie 同意横幅。**未同意前 Pixel 脚本完全不加载**，「接受」后即时加载并开始上报，
  「拒绝」则永不加载。
- **追踪事件**：PageView（含 SPA 路由切换）+ 捐赠意向（点击 Stripe / monobank 按钮）+ 表单 Lead。

## 已知限制（有意接受）

1. **无法追踪真实付款完成** —— Stripe 走托管 checkout 跳走无回调、monobank 外跳 jar，没有可靠成功信号。
   捐赠只能埋「意向」（点击），不代表已付款。
2. **不做 CAPI（服务端转化 API）** —— 纯浏览器端 Pixel，够用且零后端负担；未来要提准确性再加。

## 架构总览

同意门控是核心。基于项目已有的 `useSyncExternalStore` 约定（CLAUDE.md：matchMedia 断点检测已用此模式）
实现一个轻量 consent store，横幅（`CookieConsentBanner`）和 Pixel 加载器（`FacebookPixel`）都订阅它。

数据流：

```
访客首访 → consent = 'unknown' → 横幅显示，Pixel 不加载
          ↓ 点 Accept
consent = 'granted'（写 localStorage） → store 通知订阅者
          ↓
FacebookPixel 注入 fbevents base code → fbq('init') → 首帧 PageView
          ↓ SPA 路由切换（usePathname 变化）
fbq('track', 'PageView')

          ↓ 点 Decline
consent = 'denied'（写 localStorage） → 横幅隐藏，Pixel 永不加载
```

撤回同意：Footer 的「Cookie preferences」链接把 consent 重置为 `unknown`，横幅重新弹出。

## 新增文件

### `src/lib/consent.ts`（client-safe）

同意状态的模块级外部 store，`useSyncExternalStore` 模式 + localStorage 持久化。

- 类型：`type ConsentState = 'granted' | 'denied' | 'unknown'`
- localStorage key：`wth_cookie_consent`，值 `'granted'` / `'denied'`（`unknown` = 无记录）
- 导出：
  - `useConsent(): ConsentState` —— React hook（`useSyncExternalStore`，`getServerSnapshot` 返回 `'unknown'`）
  - `getConsent(): ConsentState` —— 非 hook 读取（供 `track()` 用），SSR 安全（`typeof window` 守卫）
  - `setConsent(v: 'granted' | 'denied'): void` —— 写 localStorage + 通知订阅者
  - `resetConsent(): void` —— 清 localStorage + 通知（Footer 撤回用）

### `src/lib/fbpixel.ts`（client-safe）

- `FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID`
- `PIXEL_ENABLED = Boolean(FB_PIXEL_ID)`
- `pageview(): void` —— `if (!window.fbq) return;` 后 `fbq('track', 'PageView')`
- `track(event: string, params?: Record<string, unknown>): void` ——
  guard `getConsent() === 'granted'` + `window.fbq` 存在；否则静默返回。
- 顶部声明 `declare global { interface Window { fbq?: (...args: unknown[]) => void } }`

### `src/components/analytics/FacebookPixel.tsx`（client 组件）

- `useConsent()` 订阅同意状态。
- `granted` 且 `PIXEL_ENABLED` 时，用 `next/script`（`strategy="afterInteractive"`, `id="fb-pixel"`）
  注入 Meta base code inline snippet：定义 `fbq` stub → 加载 `https://connect.facebook.net/en_US/fbevents.js`
  → `fbq('init', FB_PIXEL_ID)` + `fbq('track', 'PageView')`（首帧 PageView 由 init 段触发）。
- `usePathname()` 变化时 `useEffect` 触发 `pageview()`；用 ref **跳过首次调用**避免与 init 段的首帧
  PageView 重复计数。
- **只用 `usePathname` 不用 `useSearchParams`** —— 后者触发 CSR bailout，会破坏 layout 的静态渲染
  （layout 的 `generateStaticParams` 注释明确在乎 HTML 进 CDN / BFCache）。
- ID 缺失或未同意时组件渲染 `null`，零副作用。

### `src/components/analytics/CookieConsentBanner.tsx`（client 组件）

- `useConsent() === 'unknown'` 时才渲染；SSR 与首帧返回 `null`（`mounted` 守卫），避免闪烁 +
  hydration 不匹配 + 布局抖动。
- 双语文案走新 `cookies` 命名空间（`useTranslations('cookies')`）。
- 底部 fixed bar，设计语言对齐：Fixel 字体、品牌色；**Accept** = 金色 CTA（`gradient-brand` 或
  `ukraine-gold`）、**Decline** = 弱化次级按钮 + 隐私政策链接（`Link from '@/i18n/navigation'` 指向 `/privacy`）。
- 按钮 `type="button"`；容器可加 `role="dialog"` `aria-live` 等 a11y 属性。

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/app/[locale]/layout.tsx` | body 内挂 `<FacebookPixel />` + `<CookieConsentBanner />`（仅前台；admin 有独立 `src/app/admin/layout.tsx`，天然排除，Pixel 不进后台） |
| `src/components/projects/donation/useDonationFlow.ts` | `goToStripe()` 里加 `track('InitiateCheckout', { payment_method: 'stripe' })` —— 桌面 `DonationSidebar` + 移动端 `MobileDonationSheet` 共用此 hook，一处覆盖两端 |
| `src/components/projects/donation/MethodStep.tsx` | monobank `<a onClick>` 触发 `track('InitiateCheckout', { payment_method: 'monobank' })`（monobank 外跳前上报） |
| `src/components/forms/RequestAssistanceForm.tsx` | 提交成功分支（`router.push('/request-assistance/success')` 前）`track('Lead', { form: 'assistance' })` |
| `src/components/forms/PartnershipForm.tsx` | 提交成功分支同上，`track('Lead', { form: 'partnership' })` |
| `src/components/layout/Footer.tsx` | 加「Cookie preferences」按钮/链接，`onClick` 调 `resetConsent()` 重新弹横幅（GDPR 撤回同意） |
| `messages/ua.json` + `messages/en.json` | 新增 `cookies` 命名空间（横幅标题/正文/Accept/Decline/隐私链接文案 + Footer「Cookie preferences」label）；隐私政策 cookie 章节补一句点名 Meta/Facebook Pixel + 撤回方式。ua 为主语言，两文件必须同步 |
| `.env.example` | 加 `NEXT_PUBLIC_FB_PIXEL_ID=`（含注释：Meta 事件管理器里的纯数字 Pixel ID，缺失时 Pixel 不加载） |
| `CLAUDE.md` | 技术栈表 + 环境变量段记录 Meta Pixel 集成与 `NEXT_PUBLIC_FB_PIXEL_ID`、同意门控机制 |

## 事件命名（最终）

| 事件 | 触发点 | 参数 |
|------|--------|------|
| `PageView` | 页面浏览 + SPA 路由切换 | —— |
| `InitiateCheckout` | 点击 Stripe / monobank 捐赠按钮 | `{ payment_method: 'stripe' \| 'monobank' }` |
| `Lead` | Request Assistance / Partnership 表单成功提交 | `{ form: 'assistance' \| 'partnership' }` |

用 `InitiateCheckout` 而非 `Donate`：精确表达「发起结账＝点击」，不夸大成已付款。未来若要 Meta 慈善优化
的 `Donate` 标准事件，改 `fbpixel.ts` 调用处即可。

## SSR / hydration / 静态渲染注意

- consent store 的 `getServerSnapshot` 固定返回 `'unknown'`；横幅用 `mounted` 守卫在客户端挂载后才渲染，
  避免「SSR 显示横幅 → 客户端读到已同意 → 消失」的闪烁与 hydration mismatch。
- `FacebookPixel` 只用 `usePathname`，不引 `useSearchParams`，保持 layout 静态可缓存。
- Pixel ID 缺失（本地/未配置）时全链路 no-op，`npm run build` 无副作用。

## 验收标准

1. `NEXT_PUBLIC_FB_PIXEL_ID` 未配置时：无横幅行为变化，无 `fbevents.js` 请求，构建/lint 通过。
2. 配置 ID 后首访：横幅出现，Pixel 未加载（Network 无 `fbevents.js`）。
3. 点 Accept：`fbevents.js` 加载，Meta Pixel Helper 显示 PageView；刷新后横幅不再出现。
4. 点 Decline：无 `fbevents.js` 请求；刷新后横幅不再出现。
5. SPA 路由切换：每次切换触发一次 PageView（首帧不重复计数）。
6. 点 Stripe / monobank 按钮：触发 InitiateCheckout（带 payment_method）。
7. 表单成功提交：触发 Lead。
8. Footer「Cookie preferences」：横幅重新出现，可改选择。
9. admin 后台（`/admin/*`）：无横幅、无 Pixel。
10. `npm run lint` + `npm run build` 通过；ua.json / en.json 键同步。
