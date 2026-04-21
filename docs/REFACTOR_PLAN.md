# 性能与代码重构计划

> 作者: Claude Code · 创建: 2026-04-20 · 状态: 进行中
> 配套 task 列表见本次会话的 `TaskList`（subject 编号与本文一致：P0-1、P1-4 …）

---

## 范围与目标

- **范围**: waytohealth 独立站（Next.js 16 App Router + React 19 + Tailwind v4）
- **目标**:
  1. 首屏 JS / LCP 明显下降
  2. 长组件拆分，降低心智负担
  3. 填补若干安全/健壮性空档
- **非目标**: 功能变更、视觉改版、引入数据库

---

## 执行原则

- 每个 P 下的项都对应一个独立 PR，可独立回滚
- 每次改动前先跑 `npm run lint && npm run build` 基线，改完再跑一次做对比
- 按 memory 约束：`about-team.jpg` 等图片转格式时不裁切；admin 页保持英文硬编码、不走 i18n
- 不做"顺手重构"：严格按下方清单，遇到新问题另开 task

---

## 进度追踪（勾选 = 已完成）

### 🔴 P0 · 首屏性能（快赢）

- [x] **P0-1** · XLSX 动态化（S）
- [x] **P0-2** · 图片资源统一 webp（M）
- [x] **P0-3** · Stripe × monobank 并行（S）

### 🟠 P1 · 代码实现质量

- [x] **P1-4** · 三个大组件拆分（M）
- [x] **P1-5** · Card 组件 SC/CC 边界优化（M）
- [x] **P1-6** · listNewsAction 并行读取（S）
- [x] **P1-7** · 图片 URL 白名单校验（S · 安全）

### 🟡 P2 · 技术债

- [ ] **P2-8** · 速率限制升级 Vercel KV（L）— 待用户在 Vercel Dashboard 创建免费 Redis 资源
- [x] **P2-9** · 冷僻 utility 清理（S）— 清理空间有限，已同步 CLAUDE.md 样式段的完整清单
- [x] **P2-10** · News dev 缓存（S）

---

## 详细方案

### P0-1 · XLSX 动态化

- **现状**: `src/components/common/DocumentViewer.tsx:5` 顶层 `import * as XLSX from 'xlsx'`，xlsx (~500KB gzip) 被打进 about 页 client chunk，但组件只在按钮点击后才用。
- **改动**:
  - 方案 A（首选）: 改 `const XLSX = await import('xlsx')`，在 `loadExcel` 里按需加载
  - 方案 B（更彻底）: 写个构建脚本把 `public/data/documents/*.xlsx` 预解析成 JSON，运行时零 xlsx 依赖；完成后从 `package.json` 移除 xlsx
- **验收**:
  - `npm run build` 后 about 页 First Load JS 降低 ≥ 300KB
  - 手动验：点击 Excel 文档能正常预览、下载不受影响
- **文件**: `src/components/common/DocumentViewer.tsx:5,41-69`

### P0-2 · 图片资源统一 webp

- **现状**: `public/images/` 共 18MB，仍有 PNG/JPG —— `logo.png`、`hero-rehabilitation.jpg`、`about-team.jpg`、`team/*.jpg`、`partners/*.png`
- **改动**:
  1. 批量 `cwebp -q 82` 转换，保留原文件备份在本地一次
  2. 更新所有引用路径（grep `\.(png|jpg|jpeg)` 只看 `src/` 与 `messages/`）
  3. logo 额外保留 SVG 备选（如已存在则复用）
  4. 给首屏图片补 `priority` + `sizes`（Hero、首屏 ProjectCard 封面）
- **约束**: **`about-team.jpg` 不能裁切**（memory 约束），只换格式保持原尺寸
- **验收**:
  - `public/images/` 总体积 ≤ 12MB
  - Lighthouse 首页 LCP 指标相较改前下降
- **文件**: `public/images/**`, Hero/PartnersStrip/ProjectCard/PatientStories 中引用到的地方

### P0-3 · Stripe × monobank 并行

- **现状**: `src/lib/donations.ts` 的 `getRaisedAmount()` 对两路数据源串行 `await`。命中缓存时影响小，但 cold path（60s 后首个请求）会串起来。
- **改动**: 改 `Promise.all([stripe, monobank])`，保持各自降级逻辑独立。
- **验收**: 单测/手动冷启后项目详情页 TTFB 对比改前下降
- **文件**: `src/lib/donations.ts`

---

### P1-4 · 三个大组件拆分

- **现状**:
  - `src/components/projects/DonationSidebar.tsx` — 482 行
  - `src/components/admin/NewsPanel.tsx` — 447 行
  - `src/components/layout/Navigation.tsx` — 355 行
- **改动**:
  - **DonationSidebar**: 抽 `AmountStep.tsx`、`MethodStep.tsx`、`useDonationFlow.ts`（状态机 hook），主组件仅保留 view 切换与 panel 动画壳
  - **NewsPanel**: 抽 `NewsEditorForm.tsx`、`ImageUploader.tsx`、`NewsList.tsx`
  - **Navigation**: 抽 `DesktopNav.tsx`、`MobileNav.tsx`、`LocaleSwitcher.tsx`
- **约束**: 仅做结构拆分，不改任何用户可见行为；props 的 camelCase / 现有动画类名保持不变
- **验收**: 三个入口文件均 ≤ 200 行；`npm run build` 通过；手动走一遍捐赠流程、admin 发布、移动/桌面导航
- **文件**: 上述三处 + 新抽出的子文件

### P1-5 · Card 组件 SC/CC 边界优化

- **现状**:
  - `src/components/news/NewsCard.tsx` 顶层 `'use client'`，内部 `useState` 只用于 lightbox 开关
  - `src/components/projects/ProjectCard.tsx` 顶层 `'use client'`，内部 `useInViewOnce` 只用于入场动画
- **改动**: 把卡片骨架改为 Server Component，仅把"lightbox 触发按钮"「inView 动画包裹」抽成小 client wrapper
  - 新建 `NewsCardLightboxTrigger.tsx`（client）
  - 新建 `FadeInOnView.tsx` 通用包裹（client）
- **验收**: 首页/项目列表 client JS 降低，动画与 lightbox 交互完全不变
- **文件**: `src/components/news/NewsCard.tsx`, `src/components/projects/ProjectCard.tsx` + 新增两个小 client 包裹

### P1-6 · listNewsAction 并行读取

- **现状**: `src/app/actions/news.ts:178-185` 用 `for...of await getFileText()` 串行读每条新闻 JSON，admin 列表耗时随条数线性增长。
- **改动**: 改 `Promise.all(sorted.map(e => getFileText(...)))`，保留"单条解析失败跳过"逻辑。
- **验收**: admin 新闻列表首次加载明显变快；条数多时差异显著
- **文件**: `src/app/actions/news.ts:167-191`

### P1-7 · 图片 URL 白名单校验（安全）

- **现状**: `publishNewsAction` 直接信任客户端传入的 `imageUrls`，没校验域名。理论上被拿到密码的调用方可以塞任意外链进 GitHub JSON，前台随后会用 `next/image` 加载。
- **改动**: 加正则白名单：`/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//`，不符合就拒；在 `PublishInput` 的校验段落里做，同时对 `cleanupBlobAction` 的 `urls` 一并校验。
- **验收**: 单测/手动拼一个非 blob URL 传进去应被拒；正常流程不受影响
- **文件**: `src/app/actions/news.ts:46-101,152-165`

---

### P2-8 · 速率限制升级 Vercel KV

- **现状**: `src/lib/adminRateLimit.ts` 用进程内 `Map`，Vercel 多实例/冷启后状态丢失；CLAUDE.md 已列为 TODO。
- **改动**: 接 Vercel KV（或 Upstash Redis），滑动窗口存 KV；保留 Map 作为 fallback（KV 不可用时降级）
- **前置**: 需申请 KV 资源，产生月度费用 —— 落地前先与 owner 确认预算
- **文件**: `src/lib/adminRateLimit.ts`

### P2-9 · 冷僻 utility 清理

- **现状**: `src/app/globals.css` 的 `.aura-*` 系列使用零散，引用 1–2 次。
- **改动**:
  1. 统计每个 utility 的引用数
  2. 单引用的回收到局部 style 或并入 `.glow-*`
  3. 更新 CLAUDE.md「样式」段对应清单
- **验收**: globals.css 无孤儿 utility；视觉无变化
- **文件**: `src/app/globals.css`, CLAUDE.md

### P2-10 · News dev 缓存

- **现状**: `src/lib/github.ts:26` dev 环境 `cache:'no-store'`，admin 发布后本地每次导航都重新打 GitHub API。
- **改动**:
  - dev 环境也开短 TTL（10s）内存缓存
  - admin 成功发布后调用 `revalidateTag('news')` 主动失效
- **验收**: dev 下连续浏览新闻页不再每次命中 GitHub API
- **文件**: `src/lib/github.ts`, `src/app/actions/news.ts`, `src/lib/news.ts`

---

## 落地顺序

- **第 1 轮 (约 1 天)**: P1-7 → P0-1 → P1-6 → P0-3
  - 理由: 4 项全 S，含一个安全修复；首屏 JS 和 TTFB 立即受益
- **第 2 轮 (2–3 天)**: P0-2 → P1-5
  - 理由: 资源与 SC/CC 边界梳理，LCP/TTI 实质性改善
- **第 3 轮 (按需/穿插)**: P1-4 → P2-9 → P2-10 → P2-8
  - 理由: 纯技术债，不阻塞业务；P2-8 还依赖预算确认

---

## 完成标准

全部 10 项 checkbox 勾选，且：

- `npm run build` 通过
- Lighthouse 首页/项目详情页 Performance 得分相对基线不下降（预期上升）
- 手动回归: 捐赠流程（Stripe + monobank）、新闻发布/删除、多语言切换、移动端导航

---

## 变更记录

- 2026-04-20 · 初版由代码库摸底报告派生
- 2026-04-20 · 第 1 轮完成（P1-7、P0-1、P1-6、P0-3）；新增 follow-up: middleware → proxy 迁移（Next.js 16 弃用警告）
- 2026-04-20 · 第 2 轮完成（P0-2、P1-5）。P0-2 把 public/images 从 18M 压到 8.1M、public/data 从 30M 压到 9.7M，顺带删死资源 hero-rehabilitation.webp；P1-5 中 ProjectCard 改为 async Server Component（新增 FadeInOnView 通用包裹），NewsCard 中 NewsLightbox 改 dynamic import。NewsCard 本体因 admin/NewsPanel (CC) 仍需 import，整体保留 client。
- 2026-04-20 · 第 3 轮完成（P1-4、P2-9、P2-10、middleware→proxy follow-up）。P1-4 三个大组件全部拆分：Navigation 355→139（新增 LocaleSwitcher + MobileMenuPanel）、DonationSidebar 482→81（新增 donation/ 子目录：utils + useDonationFlow + AmountStep + MethodStep + StripeStep）、NewsPanel 447→35（新增 admin/news/ 子目录：types + NewsList + NewsEditor + ImageUploader）。P2-9 实际清理空间有限（所有 utility 都有合理引用，回收会违反 CLAUDE.md 品牌色规则），已同步 CLAUDE.md 样式段清单。P2-10 news.ts 改用 unstable_cache（revalidate 10s + tags: ['news']），admin 发布/删除调 revalidateTag('news', { expire: 0 }) 主动失效；适配了 Next.js 16 的新两参签名。middleware→proxy：src/middleware.ts → src/proxy.ts，消除 Next.js 16 弃用警告。剩 P2-8 待用户配合 Vercel 操作。
