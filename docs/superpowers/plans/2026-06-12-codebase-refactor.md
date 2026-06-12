# 代码库优化重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落实 2026-06-12 全库审查中已核验的 11 项优化：2 项正确性修复、4 项小修、4 项去重重构、1 项可选配置升级。

**Architecture:** 不改变任何对外行为与页面视觉。Phase 1 是相互独立的小修（正确性 + 规范 + 文档）；Phase 2 是消除重复代码的纯重构（提取共享函数 / hook / 组件）；Phase 3 可选。每个任务独立提交，任一任务可单独跳过不影响其他任务。

**Tech Stack:** Next.js 16 (App Router) / React 19 / TypeScript strict / Tailwind v4 / Neon Postgres (`@neondatabase/serverless`) / next-intl

**验证方式:** 项目无单测框架（验证走 `npm run lint` + `npm run build`，CLAUDE.md 亦未要求测试）。每个任务完成后跑 lint，每个 Phase 结束跑一次完整 build。

**审查中排除的误报（不要做）:**
- ~~`_getNews` 缓存 key 碰撞~~ — `unstable_cache` 自动把函数实参纳入缓存 key，无碰撞
- ~~projects/news 页补 `setRequestLocale` 以静态化~~ — 两页读 `searchParams`，必然动态渲染，是有意设计
- ~~ProjectGallery 去掉 dynamic import~~ — client component 里 `dynamic()` 仍有 code-split 收益
- ~~news tag 过滤页加 sitemap~~ — 查询参数过滤页不应进 sitemap

---

## 进度总览

| Phase | Task | 状态 |
|-------|------|------|
| 1 | Task 1: projectAmounts 批量 UPSERT 改原子事务 | ✅ |
| 1 | Task 2: requests action 顶层 try-catch | ✅ |
| 1 | Task 3: toLocale() 规范统一（2 处） | ✅ |
| 1 | Task 4: 死样式删除 + 注释/文档同步 | ✅ |
| 1 | Task 5: news/merch 页串行 await 并行化 | ✅ |
| 1 | Task 6: 创建 .env.example | ✅ |
| 1 | Phase 1 完整 build 验证 | ✅ |
| 2 | Task 7: 金额格式化三处重复统一 | ✅ |
| 2 | Task 8: 提取 useMobileTabs 共享 hook | ✅ |
| 2 | Task 9: AchievementsCarousel 拆分 body 渲染器 | ✅ |
| 2 | Task 10: 法律页提取 ContactCards 组件 | ✅ |
| 2 | Phase 2 完整 build 验证 | ✅ |
| 3 | Task 11（可选）: tsconfig target 升级 | ✅ |

---

# Phase 1 — 正确性修复与小修

### Task 1: projectAmounts 批量 UPSERT 改原子事务

11 次串行 UPSERT 非原子：中途失败会部分写入却已对前 N 行生效，且 11 次 HTTP 往返。Neon HTTP driver 支持非交互式批量事务 `sql.transaction([...])`（一次往返、原子提交）。`src/lib/db.ts:22-26` 的 Proxy `get` trap 已把 client 方法透出，`sql.transaction` 可直接调用。

**Files:**
- Modify: `src/app/actions/projectAmounts.ts:38-50`

- [ ] **Step 1: 替换串行循环为事务**

把 `src/app/actions/projectAmounts.ts` 中：

```typescript
  try {
    // Neon HTTP driver 无事务；每行独立 UPSERT，行间错误概率极低且互不影响
    for (const u of updates) {
      await sql`
        INSERT INTO project_amounts (project_id, raised_uah, updated_at)
        VALUES (${u.projectId}, ${Math.floor(u.raisedUah)}, NOW())
        ON CONFLICT (project_id) DO UPDATE
          SET raised_uah = EXCLUDED.raised_uah,
              updated_at = NOW()
      `;
    }
    revalidateTag('project-amounts', { expire: 0 });
    return { ok: true, saved: updates.length };
```

替换为：

```typescript
  try {
    // Neon HTTP driver 的非交互式批量事务：一次往返、原子提交，杜绝部分写入
    await sql.transaction(
      updates.map(
        (u) => sql`
          INSERT INTO project_amounts (project_id, raised_uah, updated_at)
          VALUES (${u.projectId}, ${Math.floor(u.raisedUah)}, NOW())
          ON CONFLICT (project_id) DO UPDATE
            SET raised_uah = EXCLUDED.raised_uah,
                updated_at = NOW()
        `,
      ),
    );
    revalidateTag('project-amounts', { expire: 0 });
    return { ok: true, saved: updates.length };
```

`catch` 块保持不变。

- [ ] **Step 2: 类型检查 + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: 无错误。若 `sql.transaction` 报类型错误（Proxy 类型透传问题），改为在 `src/lib/db.ts` 顶部 re-export 类型不充分时回退方案：保留循环但在 catch 中返回明确的部分失败信息——但优先确认 `NeonQueryFunction<false, false>` 自带 `transaction` 方法签名（应当自带，直接通过）。

- [ ] **Step 3: 提交**

```bash
git add src/app/actions/projectAmounts.ts
git commit -m "fix: 项目金额批量 UPSERT 改 Neon 批量事务，原子提交且单次往返"
```

---

### Task 2: requests action 顶层 try-catch

`submitAssistanceRequestAction` / `submitPartnershipRequestAction` 的 `getClientIp()` 与 `checkFormRateLimit()` 在 try-catch 之外，极端情况下（headers 异常 / Redis 客户端抛错）用户收到裸 500 而非结构化错误响应。

**Files:**
- Modify: `src/app/actions/requests.ts:102-125`（assistance）
- Modify: `src/app/actions/requests.ts:168-196`（partnership）

- [ ] **Step 1: 改写 assistance 提交的尾段**

把 `src/app/actions/requests.ts` 中 assistance action 的（约 102-125 行）：

```typescript
  const ip = await getClientIp();
  if (!(await checkFormRateLimit('assist', ip))) {
    return { ok: false, error: 'rate_limited' };
  }

  const data: AssistanceRequestData = {
    fullName,
    phone,
    email,
    city,
    applicant,
    assistance,
    description,
    consent: true,
    referral,
  };

  try {
    const id = await insertAssistanceRequest({ locale, data });
    return { ok: true, id };
  } catch (err) {
    console.error('[requests:assistance] insert failed', err);
    return { ok: false, error: 'server_error' };
  }
```

替换为（`data` 构造是纯对象字面量不会抛错，保持在 try 外；IP / 限流 / 插入全部入 try）：

```typescript
  const data: AssistanceRequestData = {
    fullName,
    phone,
    email,
    city,
    applicant,
    assistance,
    description,
    consent: true,
    referral,
  };

  try {
    const ip = await getClientIp();
    if (!(await checkFormRateLimit('assist', ip))) {
      return { ok: false, error: 'rate_limited' };
    }
    const id = await insertAssistanceRequest({ locale, data });
    return { ok: true, id };
  } catch (err) {
    console.error('[requests:assistance] submit failed', err);
    return { ok: false, error: 'server_error' };
  }
```

- [ ] **Step 2: 同样改写 partnership 提交的尾段**

把 partnership action 的（约 168-196 行）：

```typescript
  const ip = await getClientIp();
  if (!(await checkFormRateLimit('partner', ip))) {
    return { ok: false, error: 'rate_limited' };
  }

  const data: PartnershipRequestData = {
    orgName,
    contactName,
    position,
    phone,
    email,
    location,
    orgType,
    website,
    supportWay,
    interests,
    hasIdea,
    ideaDescription,
    consent: true,
    referral,
  };

  try {
    const id = await insertPartnershipRequest({ locale, data });
    return { ok: true, id };
  } catch (err) {
    console.error('[requests:partnership] insert failed', err);
    return { ok: false, error: 'server_error' };
  }
```

替换为：

```typescript
  const data: PartnershipRequestData = {
    orgName,
    contactName,
    position,
    phone,
    email,
    location,
    orgType,
    website,
    supportWay,
    interests,
    hasIdea,
    ideaDescription,
    consent: true,
    referral,
  };

  try {
    const ip = await getClientIp();
    if (!(await checkFormRateLimit('partner', ip))) {
      return { ok: false, error: 'rate_limited' };
    }
    const id = await insertPartnershipRequest({ locale, data });
    return { ok: true, id };
  } catch (err) {
    console.error('[requests:partnership] submit failed', err);
    return { ok: false, error: 'server_error' };
  }
```

- [ ] **Step 3: lint**

Run: `npm run lint`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add src/app/actions/requests.ts
git commit -m "fix: 表单提交 action 顶层 try-catch，IP 提取/限流故障返回结构化错误而非裸 500"
```

---

### Task 3: toLocale() 规范统一（全局仅 2 处）

CLAUDE.md 规定 locale 窄化必须走 `toLocale()`，但 2 处用了手写三元 `rawLocale === 'en' ? 'en' : 'ua'`（已用 grep 确认全局只有这 2 处）。

**Files:**
- Modify: `src/components/layout/LocaleSwitcher.tsx:7,13`
- Modify: `src/components/projects/ProjectCard.tsx:4,37`

- [ ] **Step 1: 修改 LocaleSwitcher.tsx**

第 7 行 import 改为：

```typescript
import { toLocale, type Locale } from '@/i18n/config';
```

第 13 行：

```typescript
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ua';
```

改为：

```typescript
  const locale = toLocale(rawLocale);
```

注意：第 18 行 `const otherLocale: Locale = locale === 'ua' ? 'en' : 'ua';` 保留不动（这是切换逻辑，不是窄化），所以 `Locale` 类型导入仍需保留。

- [ ] **Step 2: 修改 ProjectCard.tsx**

第 4 行 import：

```typescript
import { type Locale } from '@/i18n/config';
```

改为：

```typescript
import { toLocale } from '@/i18n/config';
```

第 37 行：

```typescript
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ua';
```

改为：

```typescript
  const locale = toLocale(rawLocale);
```

- [ ] **Step 3: lint + 类型检查**

Run: `npx tsc --noEmit && npm run lint`
Expected: 无错误（若 `Locale` 在 ProjectCard 其他位置仍被引用则保留 type import，先 grep 确认：`grep -n "Locale" src/components/projects/ProjectCard.tsx`）

- [ ] **Step 4: 提交**

```bash
git add src/components/layout/LocaleSwitcher.tsx src/components/projects/ProjectCard.tsx
git commit -m "refactor: locale 窄化统一走 toLocale()，移除手写三元"
```

---

### Task 4: 死样式删除 + 注释/文档同步

三件事一起做（都是 globals.css / 文档层面的失真）：
1. `globals.css:306-323` 的 `@keyframes rate-pop` + `.animate-rate-pop` 全项目无使用（grep 已确认仅定义处出现）
2. `globals.css:51` 注释说标题字重 "700/800"，实际 `fonts.ts` 只加载 400/500/600/700（ExtraBold 是刻意移除的）
3. `CLAUDE.md:418` 仍在工具类列表里引用 `animate-rate-pop`

**Files:**
- Modify: `src/app/globals.css:50-52, 306-323`
- Modify: `CLAUDE.md:418`

- [ ] **Step 1: 删除死样式**

删除 `src/app/globals.css` 中这一整块（含前导注释）：

```css
/* StripeView 中 EUR 换算标签的入场：稍晚于主 pill，轻微 overshoot 强调"换算结果" */
@keyframes rate-pop {
  0% {
    opacity: 0;
    transform: translateX(-6px) scale(0.88);
  }
  60% {
    transform: translateX(0) scale(1.04);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.animate-rate-pop {
  animation: rate-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) 140ms both;
}
```

- [ ] **Step 2: 修正字重注释**

`globals.css` 第 50-52 行：

```css
  /* --font-display 别名到 --font-body: 标题和正文都用 Fixel Text,
   * 由 font-weight 区分层级 (正文 400/500,标题 700/800)
   */
```

改为：

```css
  /* --font-display 别名到 --font-body: 标题和正文都用 Fixel Text,
   * 由 font-weight 区分层级 (正文 400/500,标题 600/700; ExtraBold 已刻意移除)
   */
```

- [ ] **Step 3: 同步 CLAUDE.md**

删除 `CLAUDE.md` 第 418 行：

```markdown
  - `animate-rate-pop` — EUR 换算徽章出现动效
```

- [ ] **Step 4: 验证删干净**

Run: `grep -rn "rate-pop" src/ CLAUDE.md messages/`
Expected: 无任何输出

- [ ] **Step 5: 提交**

```bash
git add src/app/globals.css CLAUDE.md
git commit -m "chore: 删除无引用的 animate-rate-pop 死样式，修正字重注释与文档"
```

---

### Task 5: news/merch 页串行 await 并行化

**Files:**
- Modify: `src/app/[locale]/news/page.tsx:29-33`
- Modify: `src/app/[locale]/merch/page.tsx:25-26`

- [ ] **Step 1: news 页 4 个串行 await 合并**

`src/app/[locale]/news/page.tsx` 第 29-33 行：

```typescript
export default async function NewsPage({ searchParams }: PageProps) {
  const tNav = await getTranslations('navigation');
  const tNews = await getTranslations('news');
  const locale = toLocale(await getLocale());
  const items = await getAllNews();
```

改为：

```typescript
export default async function NewsPage({ searchParams }: PageProps) {
  const [tNav, tNews, rawLocale, items] = await Promise.all([
    getTranslations('navigation'),
    getTranslations('news'),
    getLocale(),
    getAllNews(),
  ]);
  const locale = toLocale(rawLocale);
```

- [ ] **Step 2: merch 页 2 个串行 getTranslations 合并**

`src/app/[locale]/merch/page.tsx` 第 24-26 行（注意 `setRequestLocale` 必须保持在所有 `getTranslations` 之前）：

```typescript
  setRequestLocale(toLocale((await params).locale));
  const t = await getTranslations('navigation');
  const tPages = await getTranslations('pages');
```

改为：

```typescript
  setRequestLocale(toLocale((await params).locale));
  const [t, tPages] = await Promise.all([
    getTranslations('navigation'),
    getTranslations('pages'),
  ]);
```

- [ ] **Step 3: lint**

Run: `npm run lint`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add "src/app/[locale]/news/page.tsx" "src/app/[locale]/merch/page.tsx"
git commit -m "perf: news/merch 页串行 await 并行化"
```

---

### Task 6: 创建 .env.example

CLAUDE.md 详列了全部环境变量但根目录没有样板文件，新环境部署 / 协作时只能翻文档。

**Files:**
- Create: `.env.example`

- [ ] **Step 1: 创建文件**

新建 `.env.example`（值留空，注释说明来源）：

```env
# ── Neon Postgres（Vercel Marketplace 装 Neon 后自动注入；只用 DATABASE_URL）──
DATABASE_URL=                     # postgres://...pooler.../neondb?sslmode=require

# ── Vercel Blob（news 图片上传；部署环境自动注入，本地需手动复制）──
BLOB_READ_WRITE_TOKEN=

# ── Admin 密码 / 会话（三个值用 node scripts/gen-admin-hash.mjs <password> 一次性生成）──
ADMIN_PASSWORD_HASH=              # SHA-256(password + SALT)，64 位 hex
ADMIN_PASSWORD_SALT=              # 与 HASH 必须配对，改一个就得同步改另一个
ADMIN_COOKIE_SECRET=              # ≥32 字节 base64url 随机；轮换会让所有现有 cookie 失效

# ── Upstash Redis（限流；Vercel Marketplace KV 自动注入到生产/预览，本地可不配）──
KV_REST_API_URL=
KV_REST_API_TOKEN=

# ── Resend（admin 邮件发送 + inbound 转发）──
RESEND_API_KEY=                   # Resend dashboard → API Keys
RESEND_WEBHOOK_SECRET=            # Webhooks → email.received 的 whsec_... Signing Secret
FORWARD_TO_EMAIL=                 # inbound 邮件转发目标 Gmail
```

- [ ] **Step 2: 确认 .gitignore 不会误伤**

Run: `git check-ignore .env.example; echo "exit=$?"`
Expected: `exit=1`（未被 ignore；若被 ignore，在 `.gitignore` 里加一行 `!.env.example`）

- [ ] **Step 3: 提交**

```bash
git add .env.example
git commit -m "docs: 添加 .env.example 环境变量样板"
```

---

### Phase 1 完整验证

- [ ] **完整 build**

Run: `npm run build`
Expected: 构建成功，无新增警告

---

# Phase 2 — 去重重构（不改变行为与视觉）

### Task 7: 金额格式化三处重复统一

`ProjectCard.tsx:19` 与 `ProjectStrip.tsx:22` 各自定义了几乎相同的 `formatAmount`（紧凑大数字格式）；`donation/utils.ts:1` 另有 `formatCurrency`（全量数字，DonationSidebar 用，保留不动）。统一紧凑格式到 `donation/utils.ts`。

**已知行为差异（有意统一）:** ProjectStrip 版本在 `< 1000` 分支用 `Intl.NumberFormat currency` 风格（输出形如 `UAH 850`），ProjectCard 版本输出 `850 ₴`。统一采用 ProjectCard 版本（`₴` 后缀，与 ≥1K 分支一致）。实际项目金额都远超 1K，前台无可见变化。

**Files:**
- Modify: `src/components/projects/donation/utils.ts`
- Modify: `src/components/projects/ProjectCard.tsx:18-30, 145-153`
- Modify: `src/components/projects/ProjectStrip.tsx:21-39, 222`

- [ ] **Step 1: 在 donation/utils.ts 添加共享函数**

在 `formatCurrency` 之后添加：

```typescript
// 紧凑金额：≥1M → "1.2M ₴"，≥1K → "850K ₴"，否则全量数字 + 符号后缀
export function formatCompactAmount(amount: number, currency: string): string {
  const symbol = currency === 'UAH' ? '₴' : currency;
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M ${symbol}`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K ${symbol}`;
  }
  return `${amount.toLocaleString('en-US')} ${symbol}`;
}
```

（该文件无 `'use client'`，server component ProjectCard 与 client component ProjectStrip 均可导入。）

- [ ] **Step 2: ProjectCard 删本地定义改导入**

删除 `src/components/projects/ProjectCard.tsx` 第 18-30 行的 `formatAmount` 函数定义（含 `// 格式化金额：紧凑显示大数字` 注释），在文件头部添加：

```typescript
import { formatCompactAmount } from './donation/utils';
```

把文件内 3 处 `formatAmount(` 调用改名为 `formatCompactAmount(`。

- [ ] **Step 3: ProjectStrip 删本地定义改导入**

删除 `src/components/projects/ProjectStrip.tsx` 第 21-39 行的 `formatAmount` 函数定义（含注释），在文件头部添加：

```typescript
import { formatCompactAmount } from './donation/utils';
```

把第 222 行的 `formatAmount(` 调用改名为 `formatCompactAmount(`。

- [ ] **Step 4: 验证无残留 + lint**

Run: `grep -rn "function formatAmount" src/ ; npx tsc --noEmit && npm run lint`
Expected: grep 无输出；tsc / lint 无错误

- [ ] **Step 5: 提交**

```bash
git add src/components/projects/donation/utils.ts src/components/projects/ProjectCard.tsx src/components/projects/ProjectStrip.tsx
git commit -m "refactor: 紧凑金额格式化统一到 formatCompactAmount，消除两处重复定义"
```

---

### Task 8: 提取 useMobileTabs 共享 hook

`MobileTabSwitcher.tsx:48-71` 与 `MobileProjectSwitcher.tsx:31-53` 的状态机完全相同（active / direction / `go()` / `didMountRef` 跳首渲染 / `scrollIntoView` 居中），约 30 行 ×2。提取为 hook，两组件只留 UI。

**Files:**
- Create: `src/hooks/useMobileTabs.ts`
- Modify: `src/components/home/MobileTabSwitcher.tsx:3, 48-71`
- Modify: `src/components/home/MobileProjectSwitcher.tsx:3, 31-53`

- [ ] **Step 1: 创建 hook**

新建 `src/hooks/useMobileTabs.ts`：

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 移动端 tab 切换共享状态机：active 索引 + 切换方向 + go() + 激活项自动居中。
 * MobileTabSwitcher / MobileProjectSwitcher 共用；direction 驱动
 * animate-panel-forward / animate-panel-backward 的定向滑入动画。
 */
export function useMobileTabs(count: number) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const didMountRef = useRef(false);

  const go = useCallback(
    (next: number) => {
      if (next === active || next < 0 || next >= count) return;
      setDirection(next > active ? 'forward' : 'backward');
      setActive(next);
    },
    [active, count],
  );

  // 激活项自动居中到视口；首渲染跳过，避免页面加载时被动滚动
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    tabRefs.current[active]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  return { active, direction, go, tabRefs };
}
```

- [ ] **Step 2: MobileTabSwitcher 接入 hook**

删除 `src/components/home/MobileTabSwitcher.tsx` 第 48-71 行（`const [active, setActive] ...` 到自动居中 `useEffect` 整块），替换为：

```typescript
  const { active, direction, go, tabRefs } = useMobileTabs(count);
```

第 3 行 import 精简为（`useCallback` / `useEffect` / `useRef` / `useState` 不再直接使用则移除）：

```typescript
import { Children, useId, type ReactNode } from 'react';
```

并添加：

```typescript
import { useMobileTabs } from '@/hooks/useMobileTabs';
```

文件其余部分（`tabRefs.current[i] = el` 的 ref 回调等）无需改动——hook 返回的 `tabRefs` 同名。

- [ ] **Step 3: MobileProjectSwitcher 接入 hook**

删除 `src/components/home/MobileProjectSwitcher.tsx` 第 31-53 行同样的状态机整块，替换为：

```typescript
  const { active, direction, go, tabRefs } = useMobileTabs(count);
```

注意该文件原来用的名字是 `thumbRefs`——把文件内 2 处 `thumbRefs` 引用（第 33 行定义已删、第 51 行 `thumbRefs.current[active]` 已删，剩第 72-74 行 ref 回调）统一改为 `tabRefs`：

```typescript
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
```

第 3 行 import 精简为：

```typescript
import { Children, type ReactNode } from 'react';
```

并添加：

```typescript
import { useMobileTabs } from '@/hooks/useMobileTabs';
```

- [ ] **Step 4: lint + 类型检查**

Run: `npx tsc --noEmit && npm run lint`
Expected: 无错误（重点看未使用 import 的 lint 报错）

- [ ] **Step 5: 手动验证（dev 模式）**

Run: `npm run dev` 后在移动端视口（<640px）检查首页：
- 项目区缩略图导航：点击切换有定向滑入动画、激活项自动居中
- Values / Achievements tab：同样行为
Expected: 与改动前行为一致

- [ ] **Step 6: 提交**

```bash
git add src/hooks/useMobileTabs.ts src/components/home/MobileTabSwitcher.tsx src/components/home/MobileProjectSwitcher.tsx
git commit -m "refactor: 提取 useMobileTabs hook，消除两个移动端切换器的重复状态机"
```

---

### Task 9: AchievementsCarousel 拆分 body 渲染器

`renderInner`（`AchievementsCarousel.tsx:69-216`，146 行）靠 `i === 0/1/2/3` 四个条件分支渲染四种卡片 body。拆成 4 个独立渲染函数 + 查表数组，共享的 figure / meta / title 保留在 `renderInner`。**纯代码搬移，JSX 一字不改。**

**Files:**
- Modify: `src/components/home/AchievementsCarousel.tsx:61-216`

- [ ] **Step 1: 添加 Accent 类型别名与 4 个 body 渲染函数**

在 `isStat` 函数（第 61-65 行）之后插入：

```typescript
type Accent = (typeof ENTRY_ACCENT)[number];

/* ── 4 张卡片的差异化 body 渲染器（与卡片序号一一对应）────────────── */

// Card 0 · Recovery Support —— 数据 tag 型：
// - mobile / sm / md：chip 风格 flex-wrap，紧凑
// - lg+：切到竖排全宽 tinted 块（每行一项 + 大字号 + 大间距），
//   把左列与右列高差吃掉，避免 mt-auto 留出过大空白
function renderChipsBody(item: AchievementItem, accent: Accent) {
  return (
    <>
      <p className="mt-3 text-[0.92rem] leading-[1.6] text-gray-600">{item.text}</p>
      {item.list && (
        <ul className="mt-4 flex flex-wrap gap-1.5 lg:mt-4 lg:flex-col lg:flex-nowrap lg:gap-1">
          {item.list.map(li => (
            <li
              key={li}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] font-medium leading-none lg:flex lg:w-full lg:gap-2.5 lg:rounded-md lg:px-3.5 lg:py-1.5 lg:text-[0.85rem] lg:leading-tight"
              style={{ background: accent.soft, color: accent.eyebrow }}
            >
              <span
                aria-hidden
                className="h-1 w-1 shrink-0 rounded-full"
                style={{ background: accent.dot }}
              />
              {li}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Card 1 · Ambulance —— 叙事 lead 型：首段 italic + 略大字号 + 较深字色，
// 后续段统一 body 字号；不混用衬线字体（PT Serif 仅做装饰性点缀）
function renderLeadBody(item: AchievementItem) {
  const paragraphs = item.text.split('\n\n').filter(Boolean);
  return paragraphs.map((para, pi) => (
    <p
      key={pi}
      className={
        pi === 0
          ? 'mt-3 text-[0.98rem] italic leading-[1.65] text-ukraine-blue-900 sm:mt-4 sm:text-[1.02rem]'
          : 'mt-3 text-[0.92rem] leading-[1.65] text-gray-600'
      }
    >
      {para}
    </p>
  ));
}

// Card 2 · Humanitarian —— 行动分块型：双段独立 panel，左 accent bar + 软色背景
function renderPanelsBody(item: AchievementItem, accent: Accent) {
  const paragraphs = item.text.split('\n\n').filter(Boolean);
  return (
    <div className="mt-4 space-y-2.5">
      {paragraphs.map((para, pi) => (
        <div
          key={pi}
          className="rounded-r-lg border-l-[3px] py-2.5 pl-4 pr-3"
          style={{ borderColor: accent.dot, background: accent.soft }}
        >
          <p className="text-[0.9rem] leading-[1.55] text-gray-700">{para}</p>
        </div>
      ))}
    </div>
  );
}

// Card 3 · International —— KPI 卡片型：italic lead + 2 个大数字 stat 块。
// lead 用默认 body 字体的 italic（不切到 PT Serif）
function renderStatsBody(item: AchievementItem, accent: Accent) {
  return (
    <>
      <p className="mt-3 text-[0.96rem] italic leading-[1.6] text-ukraine-blue-900 sm:mt-4 sm:text-[1rem]">
        {item.text}
      </p>
      {item.stats && (
        <dl className="mt-5 grid grid-cols-2 gap-3">
          {item.stats.map(s => (
            <div
              key={s.value}
              className="rounded-lg p-3.5 ring-1 ring-ukraine-blue-100/70"
              style={{ background: accent.soft }}
            >
              <dt
                className="font-[family-name:var(--font-data)] text-[1.75rem] font-bold leading-none sm:text-[2rem]"
                style={{ color: accent.eyebrow }}
              >
                {s.value}
              </dt>
              <dd className="mt-2 text-[0.78rem] leading-snug text-gray-600">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}

// 序号 → body 渲染器查表；与 ENTRY_ACCENT / IMAGE_DIMENSIONS 同序
const BODY_RENDERERS: Array<(item: AchievementItem, accent: Accent) => React.ReactNode> = [
  renderChipsBody,
  renderLeadBody,
  renderPanelsBody,
  renderStatsBody,
];
```

- [ ] **Step 2: 精简 renderInner**

`renderInner` 函数体内：
1. 删除第 75 行 `const paragraphs = item.text.split('\n\n').filter(Boolean);`（已下沉到各 body 函数）
2. 把第 124-213 行的四个 `{i === N && ...}` 条件块整体替换为一行：

```typescript
      {/* body —— 4 张卡片差异化样式，按序号查表 */}
      {BODY_RENDERERS[i]?.(item, accent)}
```

`renderInner` 的签名与 figure / meta badge / title 部分（第 69-122 行）保持不变。

- [ ] **Step 3: lint + 类型检查**

Run: `npx tsc --noEmit && npm run lint`
Expected: 无错误

- [ ] **Step 4: 视觉验证（dev 模式）**

Run: `npm run dev` 打开 `http://localhost:3000/ua`，滚到 About 区 Achievements：
- 移动端（<640px）：4 个 tab 各自切换，4 种 body 样式（chip 列表 / 叙事段落 / 左侧 accent bar 分块 / 2 列大数字 stat）与改动前一致
- 桌面端（≥1024px）：2 列布局底端对齐不变
Expected: 视觉零变化

- [ ] **Step 5: 提交**

```bash
git add src/components/home/AchievementsCarousel.tsx
git commit -m "refactor: AchievementsCarousel 四种卡片 body 拆为独立渲染器，消除 146 行多分支函数"
```

---

### Task 10: 法律页提取 ContactCards 组件

privacy / terms / public-agreements 三页各有约 55 行逐字相同的"三联联系卡片"（Email / Address / Phone），已 diff 核实三处 JSX 完全一致（仅翻译命名空间不同）。提取为接收纯字符串 props 的 server 组件。

**Files:**
- Create: `src/components/terms/ContactCards.tsx`
- Modify: `src/app/[locale]/privacy/page.tsx:3, 191-245`
- Modify: `src/app/[locale]/terms/page.tsx:3, ≈183-237`
- Modify: `src/app/[locale]/public-agreements/page.tsx:3, ≈331-385`

- [ ] **Step 1: 创建共享组件**

新建 `src/components/terms/ContactCards.tsx`（JSX 从 privacy 页原样搬移，仅把 `t('contact.*')` 换成 props）：

```typescript
import { Mail, MapPin, Phone } from 'lucide-react';

interface ContactCardsProps {
  email: string;
  emailLabel: string;
  address: string;
  addressLabel: string;
  phone: string;
  phoneLabel: string;
}

/** 法律页（privacy / terms / public-agreements）共用的三联联系卡片 */
export default function ContactCards({
  email,
  emailLabel,
  address,
  addressLabel,
  phone,
  phoneLabel,
}: ContactCardsProps) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {/* Email */}
      <a
        href={`mailto:${email}`}
        className="group relative overflow-hidden rounded-2xl border border-ukraine-blue-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/50"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ukraine-blue-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-ukraine-blue-200/50 transition-shadow duration-300 group-hover:shadow-ukraine-blue-300/60">
            <Mail className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <p className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-400">
            {emailLabel}
          </p>
          <p className="mt-2 break-all text-sm font-medium text-ukraine-blue-800 transition-colors group-hover:text-ukraine-blue-600 sm:text-[15px]">
            {email}
          </p>
        </div>
      </a>

      {/* Address */}
      <div className="group relative overflow-hidden rounded-2xl border border-ukraine-blue-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/50">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ukraine-gold-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-ukraine-blue-200/50 transition-shadow duration-300 group-hover:shadow-ukraine-blue-300/60">
            <MapPin className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <p className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-400">
            {addressLabel}
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-ukraine-blue-800 sm:text-[15px]">
            {address}
          </p>
        </div>
      </div>

      {/* Phone */}
      <a
        href={`tel:${phone.replace(/\s/g, '')}`}
        className="group relative overflow-hidden rounded-2xl border border-ukraine-blue-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/50"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ukraine-blue-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-ukraine-blue-200/50 transition-shadow duration-300 group-hover:shadow-ukraine-blue-300/60">
            <Phone className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <p className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-400">
            {phoneLabel}
          </p>
          <p className="mt-2 font-[family-name:var(--font-data)] text-sm font-medium tracking-wide text-ukraine-blue-800 transition-colors group-hover:text-ukraine-blue-600 sm:text-[15px]">
            {phone}
          </p>
        </div>
      </a>
    </div>
  );
}
```

- [ ] **Step 2: 三个页面替换为组件调用**

在每个页面（`privacy/page.tsx`、`terms/page.tsx`、`public-agreements/page.tsx`）中，把 `{/* 三联联系卡片 */}` 注释起、到对应 `</div>`（grid 容器闭合）止的整块（privacy 为第 190-245 行；terms / public-agreements 用 `grep -n "三联联系卡片" <file>` 定位起点，块结构与 privacy 逐字一致）替换为：

```typescript
                  <ContactCards
                    email={t('contact.email')}
                    emailLabel={t('contact.emailLabel')}
                    address={t('contact.address')}
                    addressLabel={t('contact.addressLabel')}
                    phone={t('contact.phone')}
                    phoneLabel={t('contact.phoneLabel')}
                  />
```

（缩进与原 grid 块对齐；各页 `t` 来自各自命名空间，键名相同。）

每个页面头部添加：

```typescript
import ContactCards from '@/components/terms/ContactCards';
```

- [ ] **Step 3: 清理三个页面的 lucide 图标导入**

三页第 3 行均为 `import { Mail, MapPin, Phone } from 'lucide-react';`。逐页 grep 确认这三个图标除联系卡片外无其他使用后整行删除：

Run: `grep -n "Mail\|MapPin\|Phone" "src/app/[locale]/privacy/page.tsx" "src/app/[locale]/terms/page.tsx" "src/app/[locale]/public-agreements/page.tsx"`
Expected: 替换后只剩 import 行本身 → 删除该 import 行；若某页还有其他使用则保留所需图标

- [ ] **Step 4: lint + 类型检查**

Run: `npx tsc --noEmit && npm run lint`
Expected: 无错误

- [ ] **Step 5: 视觉验证（dev 模式）**

Run: `npm run dev` 检查 `/ua/privacy`、`/ua/terms`、`/ua/public-agreements` 底部联系卡片区：三卡布局 / hover 浮起 / mailto 与 tel 链接行为不变
Expected: 视觉零变化

- [ ] **Step 6: 提交**

```bash
git add src/components/terms/ContactCards.tsx "src/app/[locale]/privacy/page.tsx" "src/app/[locale]/terms/page.tsx" "src/app/[locale]/public-agreements/page.tsx"
git commit -m "refactor: 三个法律页提取共享 ContactCards 组件，消除约 165 行重复 JSX"
```

---

### Phase 2 完整验证

- [ ] **完整 build**

Run: `npm run build`
Expected: 构建成功，无新增警告

---

# Phase 3 — 可选

### Task 11（可选）: tsconfig target 升级

`tsconfig.json` 的 `"target": "ES2017"`。**注意真实影响有限**：Next.js 用 SWC 按 browserslist 编译产物，tsconfig `target` 主要影响类型检查层（可用的 lib 类型）而非 bundle 输出。升级到 ES2022 与项目实际运行环境（Node 18+ / Chrome 92+ / Safari 15.4+）对齐，纯卫生项。

**Files:**
- Modify: `tsconfig.json:3`

- [ ] **Step 1: 修改 target**

```json
    "target": "ES2022",
```

- [ ] **Step 2: 类型检查 + 完整 build**

Run: `npx tsc --noEmit && npm run build`
Expected: 无错误。若出现 lib 类型冲突（极少见），回退此任务即可，无连带影响。

- [ ] **Step 3: 提交**

```bash
git add tsconfig.json
git commit -m "chore: tsconfig target 升级到 ES2022，与实际运行环境对齐"
```

---

## 完成后

- [ ] 全部任务完成后更新本文档「进度总览」表格状态
- [ ] 跑一次 `npm run build && npm run lint` 终验
- [ ] 如 CLAUDE.md 中「Neon HTTP driver 无连接池管理」等描述需补充 `sql.transaction` 用法说明，可在 Task 1 合入后顺手更新（可选）
