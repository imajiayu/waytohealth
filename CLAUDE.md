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
- 本站是 Way to Health 的独立网站，拥有自己的 Supabase 和 Stripe
- 两站共享设计语言和技术模式，但后端完全独立
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
| 后端 | Supabase (PostgreSQL + Auth) | 独立实例 |
| 邮件 | Resend | 捐赠通知、订阅邮件 |
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

## 项目结构

```
src/
├── app/
│   ├── globals.css              # Tailwind v4 全局样式（@import "tailwindcss"）
│   ├── layout.tsx               # 根 layout（html lang）
│   └── [locale]/                # 国际化路由
│       ├── layout.tsx           # locale layout（字体、NextIntlClientProvider）
│       ├── page.tsx             # 首页
│       ├── about/               # 关于我们
│       ├── projects/            # 项目详情（/projects?id=N）
│       ├── donation-success/    # 捐赠成功页（Stripe 回调）
│       ├── merch/               # 周边商品
│       ├── news/                # 新闻动态
│       ├── partners/            # 合作伙伴
│       ├── terms/               # 条款与条件
│       ├── privacy/             # 隐私政策
│       └── public-agreements/   # 公共协议（捐赠公开要约）
├── components/
│   ├── about/                   # 关于页组件（VideoStory, TeamCollage, DocumentAccordion）
│   ├── common/                  # 通用 UI 组件（BottomSheet, DocumentViewer）
│   ├── home/                    # 首页组件（HeroSection, ProjectsSection, AboutSection, ValuesAccordion, AchievementsCarousel）
│   ├── layout/                  # 布局组件（Navigation, Footer, LoadingBar, CopyIbanButton）
│   ├── partners/                # 合作伙伴组件（PartnersStrip）
│   ├── projects/                # 项目组件（ProjectCard, ProjectStrip, DonationSidebar, MobileDonationSheet, PatientStories, RecoveryJourney, ProjectGallery）
│   └── terms/                   # 法律页面组件（TermsTOC 目录导航）
├── hooks/
│   ├── useAutoScroll.ts         # 横向自动滚动 hook
│   ├── useBodyScrollLock.ts     # 锁定页面滚动（Modal、BottomSheet 等场景）
│   └── useInViewOnce.ts         # 滚动入场检测（共享 IntersectionObserver）
├── data/
│   ├── partners.json            # 合作伙伴原始数据
│   ├── partners.ts              # 合作伙伴类型定义 + 类型化导出
│   └── projects.ts              # 项目类型定义
├── i18n/
│   ├── config.ts                # 语言配置（locales, defaultLocale）
│   ├── request.ts               # next-intl 请求配置
│   └── routing.ts               # next-intl 路由配置
├── app/actions/
│   └── donate.ts                # Stripe Checkout server action
├── lib/
│   ├── utils.ts                 # cn() 工具函数
│   ├── stripe.ts                # Stripe 客户端单例
│   └── donations.ts             # 已筹金额查询（带缓存）
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
- Admin 后台全英文，不使用 i18n

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
