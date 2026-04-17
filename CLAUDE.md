# Way to Health - 康复中心网站

> 乌克兰 Way to Health 慈善基金会旗下康复中心的独立全功能网站，支持项目展示、在线支付和捐赠管理

---

## 项目概述

**域名**: https://waytohealth.org.ua/
**组织**: Way to Health 慈善基金会（乌克兰）
**定位**: 独立全功能站 — 康复中心宣传 + 项目展示 + Stripe 收款 + 捐赠管理
**关联项目**: [waytofutureua](~/waytofutureua) - Way to Future UA 综合慈善平台（waytofutureua.org.ua）

### 与 waytofutureua 的关系

- waytofutureua 是 Way to Future UA 的综合慈善平台（waytofutureua.org.ua）
- 本站是 Way to Health 的独立网站，拥有自己的 Stripe 账号
- 两站共享设计语言和技术模式，但各自独立
- 未来可考虑两站之间的品牌联动（互相链接等）

---

## 快速开始

```bash
npm install
npm run dev      # 启动开发服务器 (http://localhost:3000)
npm run build    # 生产构建
npm run lint     # ESLint 检查
npm run start    # 启动生产服务器
```

---

## 技术栈

### 已集成

| 类型 | 技术 | 版本/说明 |
|------|------|-----------|
| 前端 | Next.js (App Router), TypeScript, Tailwind CSS | Next.js 16, React 19, Tailwind v4 |
| 国际化 | next-intl | 支持 ua (乌克兰语) + en (英语) |
| 部署 | Vercel | 与 NGO_web 一致 |
| 支付 | Stripe | 法币支付（UAH，Checkout Sessions） |

### 计划集成（尚未安装）

| 类型 | 技术 | 说明 |
|------|------|------|
| 邮件 | Resend | 捐赠通知邮件 |
| 监控 | Sentry | 错误追踪 |
| 分析 | Vercel Analytics | 流量分析 |

### 设计系统（与 NGO_web 对齐）

| 要素 | 方案 |
|------|------|
| 主色 | Logo 渐变: #006CB2 → #008DB8 → #00A7BD → #77C3CD → #DCDCDC |
| CTA | Ukraine Gold (#F5B800) |
| 成功 | #10B981 (绿) |
| 警告 | #E76F51 (橙) |
| 主字体 | **Fixel Text** (无衬线，MacPaw 开源乌克兰字体，自托管在 `public/fonts/fixel/`) — 同时承担正文 (`--font-body`) 和标题 (`--font-display`)，靠权重区分 (400/500/600/700/800) |
| 辅助衬线字体 | **PT Serif** (Google Fonts，替代品牌规范中的 Sitka Text) — 用于装饰性标题点缀 (`--font-accent`)，不用于大段正文 |
| 数据字体 | **JetBrains Mono** (等宽，`--font-data`) — 用于数字、标签、序号 |
| 图标 | Lucide React |
| 工具 | clsx + tailwind-merge → `cn()` |

---

## 支付方案（Stripe-only，无数据库）

项目**不使用数据库**。所有订单数据（捐赠记录、金额、元数据）全部由 Stripe 托管，通过 Stripe API 读取。

### 核心流程

```
用户点击「Підтримати」
    ↓
createCheckoutSession (src/app/actions/donate.ts)
    - 校验 projectId（必须在 PROJECTS 常量中）
    - 校验金额（UAH，1 ~ 999999 正整数）
    - 创建 Stripe Checkout Session（mode: payment，currency: uah）
    - metadata 写入 { project_id }（PaymentIntent 也同步写入，用于后续搜索）
    ↓
重定向到 Stripe 托管支付页
    ↓
成功 → /[locale]/donation-success?session_id=...
取消 → 回到项目详情页
```

### 已筹金额展示

`src/lib/donations.ts` 中的 `getRaisedAmount(projectId)`：
- 调用 `stripe.paymentIntents.search`，按 `status:'succeeded' AND metadata['project_id']:'N'` 聚合金额
- 用 `next/cache` 的 `unstable_cache` 包裹，`revalidate: 60` 秒
- Stripe 调用失败时返回 0，不阻塞渲染

### 项目/商品数据

不走数据库，走静态文件 + TypeScript 常量：
- `public/data/projects/{id}/data.json` + `cover.webp` + `gallery/*`
- `public/data/projects/index.json` — 列表 + 排序 + `active` 开关
- `src/data/projects.ts` — `PROJECTS` 常量（id 白名单，编译期类型检查）
- `src/lib/data.ts` — `getProject(id)` / `getAllProjects()`（`react.cache` 请求级去重）

### 有意省略的能力

下面这些能力在纯 Stripe 架构下**不提供**，如未来需要再引入数据库：
- 捐赠者留言 / 公开捐赠墙
- Admin 后台（订单列表、状态机、发货跟踪）
- 月捐（订阅）
- 商品购买的收货地址、快递单号
- Webhook 回调（当前架构不需要，Stripe Search 即数据源）
- 邮件通知（Resend 未接入）

### 环境变量

```env
STRIPE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` 用于拼接 Checkout 的 `success_url` / `cancel_url`。

---

## 新闻系统（GitHub + Vercel Blob，无数据库）

News 页面是 Twitter 风格的双语时间线 (`/[locale]/news`)，配独立 admin 后台 (`/admin/news`)：

**文案存储（GitHub）**：`public/data/news/index.json` + `items/{id}.json`。通过 **GitHub contents API** 直接 commit 到仓库；Vercel 收到 push 自动重建，~1 分钟后上线。

**图片存储（Vercel Blob）**：admin 选图后，浏览器通过 `@vercel/blob/client` 的 `upload()` **直接上传到 Blob**（绕开 server action 4.5MB body 限制），拿到完整 URL 后写入 JSON 的 `images: string[]` 字段。前端 `next/image` 直接用 Blob URL 加载（已在 `next.config.ts` `images.remotePatterns` 里允许 `*.public.blob.vercel-storage.com`）。

**Blob client upload 流程**：
1. 客户端 `upload()` 先 POST 到 `/api/news/upload`（传 `clientPayload: password`）
2. API route (`src/app/api/news/upload/route.ts`) 调 `handleUpload`，在 `onBeforeGenerateToken` 里用 `verifyAdminPassword(clientPayload)` 校验
3. 验证通过后返回短时 upload token → 客户端拿 token 直传 Blob → 得到 URL
4. 所有 URL 一起提交给 `publishNewsAction` → 仅 commit JSON 到 GitHub

**密码校验**：`src/lib/adminAuth.ts` 提供 `verifyAdminPassword(pw)`（SHA-256(pw+SALT) 常数时间比对 `ADMIN_PASSWORD_HASH`）。生成 hash：`node scripts/gen-admin-hash.mjs <password>`。外层有 IP 速率限制 `src/lib/adminRateLimit.ts`：15 分钟滑动窗口 10 次失败触发 30 分钟锁定（进程内 Map，Vercel 多实例/冷启动会丢状态，仅挡单实例高频探测；真正防爆破需 Vercel KV — TODO）。

**删除**：`deleteNewsAction` 读取 item JSON 的 `images` URLs → 调 `@vercel/blob` 的 `del(urls)` 清理 Blob → 删 GitHub 上的 item JSON + 更新 index。

**Admin 不走 i18n**：`/admin/news` 在 app router 根目录（不是 `[locale]/admin`），有独立 `src/app/admin/layout.tsx`（共享字体从 `src/app/fonts.ts`）。页面内容全英文硬编码，不使用 `useTranslations`。

### 新闻相关环境变量

```env
# GitHub commit（server action 用）
GITHUB_TOKEN=github_pat_...       # Fine-grained PAT，Contents RW，限定本仓库
GITHUB_REPO=owner/waytohealth     # owner/repo
GITHUB_BRANCH=main

# Vercel Blob（图片上传）
BLOB_READ_WRITE_TOKEN=            # Vercel Blob store token（Vercel 自动注入于部署环境，本地需手动复制）

# Admin 密码
ADMIN_PASSWORD_HASH=              # SHA-256(password + SALT)，64 位 hex
ADMIN_PASSWORD_SALT=wth-news-2026 # 可选，默认值见 src/lib/adminAuth.ts
```

---

## 项目结构

```
src/
├── app/
│   ├── globals.css              # Tailwind v4 全局样式（@import "tailwindcss"）
│   ├── layout.tsx               # 根 layout（pass-through）
│   ├── fonts.ts                 # 共享字体加载（Fixel / PT Serif / JetBrains Mono）
│   ├── admin/                   # Admin 路由（不走 i18n，独立 HTML/body）
│   │   ├── layout.tsx           # admin 自己的 <html><body>（英文）
│   │   └── news/page.tsx        # News 管理后台
│   ├── api/news/upload/         # Vercel Blob client upload handler
│   └── [locale]/                # 国际化路由（前台）
│       ├── layout.tsx           # locale layout（NextIntlClientProvider + Nav/Footer）
│       ├── page.tsx             # 首页
│       ├── about/               # 关于我们
│       ├── projects/            # 项目详情（/projects?id=N）
│       ├── donation-success/    # 捐赠成功页（Stripe 回调）
│       ├── merch/               # 周边商品
│       ├── news/                # 新闻动态（Twitter 风格双语时间线）
│       ├── partners/            # 合作伙伴
│       ├── terms/               # 条款与条件
│       ├── privacy/             # 隐私政策
│       └── public-agreements/   # 公共协议（捐赠公开要约）
├── components/
│   ├── about/                   # 关于页组件（VideoStory, TeamCollage, DocumentAccordion）
│   ├── common/                  # 通用 UI 组件（BottomSheet, DocumentViewer）
│   ├── home/                    # 首页组件（HeroSection, ProjectsSection, AboutSection, ValuesAccordion, AchievementsCarousel, NewsSection）
│   ├── layout/                  # 布局组件（Navigation, Footer, LoadingBar, CopyIbanButton）
│   ├── partners/                # 合作伙伴组件（PartnersStrip）
│   ├── projects/                # 项目组件（ProjectCard, ProjectStrip, DonationSidebar, MobileDonationSheet, PatientStories, RecoveryJourney）
│   ├── news/                    # 新闻组件（NewsCard, NewsLightbox, HomeDispatchCard, HomeDispatchCtaCard）
│   ├── admin/                   # Admin 后台组件（news 编辑器、图片上传等）
│   └── terms/                   # 法律页面组件（TermsTOC 目录导航）
├── hooks/
│   ├── useAutoScroll.ts         # 横向自动滚动 hook
│   ├── useBodyScrollLock.ts     # 锁定页面滚动（Modal、BottomSheet 等场景）
│   └── useInViewOnce.ts         # 滚动入场检测（共享 IntersectionObserver）
├── data/
│   ├── partners.json            # 合作伙伴原始数据
│   ├── partners.ts              # 合作伙伴类型定义 + 类型化导出
│   ├── projects.ts              # 项目类型定义
│   └── news.ts                  # 新闻类型定义
├── i18n/
│   ├── config.ts                # 语言配置（locales, defaultLocale）
│   ├── request.ts               # next-intl 请求配置
│   └── routing.ts               # next-intl 路由配置
├── app/actions/
│   ├── donate.ts                # Stripe Checkout server action
│   └── news.ts                  # News admin（密码校验 + GitHub commit）
├── lib/
│   ├── utils.ts                 # cn() 工具函数
│   ├── stripe.ts                # Stripe 客户端单例
│   ├── donations.ts             # 已筹金额查询（带缓存）
│   ├── news.ts                  # 新闻读取（镜像 data.ts）
│   ├── github.ts                # GitHub contents API 封装（server-only）
│   ├── adminAuth.ts             # 管理员密码 hash 校验（server-only）
│   └── adminRateLimit.ts        # 管理员登录 IP 速率限制（server-only，进程内滑动窗口）
└── middleware.ts                # i18n 路由中间件
messages/
├── ua.json                      # 乌克兰语翻译
└── en.json                      # 英语翻译
```

---

## 国际化

支持 2 种语言: `ua` (乌克兰语, 主语言), `en` (英语)

**禁止在代码中硬编码用户可见文案。** 所有 UI 文本必须使用翻译键。

```typescript
// Server Component
const t = await getTranslations('namespace')

// Client Component
const t = useTranslations('namespace')
```

翻译文件位于 `messages/` 目录：
- `messages/ua.json` - 乌克兰语（主语言）
- `messages/en.json` - 英语

**例外情况：**
- 品牌名称可以硬编码（如 "Way to Health"）
- **Admin 后台全英文，不走 i18n**：路径为 `/admin/news`（不在 `[locale]` 下），有独立的 `src/app/admin/layout.tsx`。页面内容直接英文硬编码，不调用 `getTranslations` / `useTranslations`。新增 admin 页按同样模式放在 `src/app/admin/<name>/page.tsx`。

---

## 编码规范

### 样式

- **禁止在 JSX 中硬编码品牌色的 inline style**。使用 `globals.css` 中定义的工具类：
  - `gradient-brand-full` — Logo 全色渐变（Hero 背景等大面积场景）
  - `gradient-brand` — 品牌主渐变（按钮等）
  - `gradient-brand-line` — 横向渐变（分隔线、LoadingBar）
  - `gradient-brand-progress` — 进度条渐变
  - `shadow-brand-cta` — 品牌色投影（CTA 按钮等）
  - `glow-teal` / `glow-blue` / `glow-blue-soft` / `glow-gold` / `glow-gold-soft` — 装饰光晕背景
- **页面内容容器**统一使用 `container-page` 类（max-w-7xl + 响应式内边距），不要手写 `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **区域标题装饰线**统一使用 `accent-line` 类
- **隐藏滚动条**统一使用 `hide-scrollbar` 类，不要写 `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
- Tailwind 颜色使用 `@theme` 中定义的语义化 token（如 `text-ukraine-blue-500`），不要用十六进制

### TypeScript

- **Locale 类型**：使用 `import { type Locale } from '@/i18n/config'`，禁止硬编码 `as 'ua' | 'en'`
- 保持 `strict: true`，避免 `any`
- **JSON 数据文件**必须有对应的 `.ts` 文件提供类型定义和类型化导出（如 `partners.json` → `partners.ts`），组件中导入类型化版本而非直接导入 JSON
- **禁止 `as` 类型断言绕过类型检查**，应通过接口定义正确的类型

### 路由链接

- **内部链接**必须使用 `import { Link } from '@/i18n/navigation'`，禁止使用 `<a href="/">` 或 Next.js 原生 `<Link>`，否则会丢失 locale 前缀
- 外部链接使用普通 `<a>` + `target="_blank" rel="noopener noreferrer"`

### 图片

- **始终使用 `next/image` 的 `<Image>` 组件**，禁止使用 `<img>` 标签（即使加 eslint-disable 注释也不行）

### React 模式

- **禁止在渲染期间更新 ref**（`ref.current = value` 不能直接写在组件函数体中），必须放在 `useEffect` 内
- **删除死代码**：未被任何地方使用的组件、props、代码分支应及时清理，不要为假想的未来需求保留

### 组件

- 可复用的 hook 放在 `src/hooks/` 目录
- 横向自动滚动使用 `useAutoScroll` hook（`src/hooks/useAutoScroll.ts`），不要重复实现 requestAnimationFrame 逻辑

---

## 注意��项 (Gotchas)

- **Tailwind v4**: 使用 CSS-first 配置（`@import "tailwindcss"`），不再有 `tailwind.config.js`。自定义主题通过 `globals.css` 中的 `@theme` 定义
- **Next.js 16 异步 API**: `cookies()`、`headers()`、`params`、`searchParams` 都需要 `await`
- **middleware.ts 位置**: 在 `src/middleware.ts`（不是项目根目录），仅用于 next-intl 路由
- **默认语言**: `ua`（乌克兰语）是默认语言，不是 `en`
- **翻译键同步**: 添加新 UI 文案时，`ua.json` 和 `en.json` 必须同时更新

---

## 交流语言

- 始终使用中文与用户交流
- 代码注释使用中文
- Git commit message 使用中文
