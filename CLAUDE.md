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

### 计划集成（尚未安装）

| 类型 | 技术 | 说明 |
|------|------|------|
| 后端 | Supabase (PostgreSQL + Auth) | 独立实例 |
| 支付 | Stripe | 法币支付（信用卡、Apple Pay、Google Pay） |
| 邮件 | Resend | 捐赠通知、订阅邮件 |
| 监控 | Sentry | 错误追踪 |
| 分析 | Vercel Analytics | 流量分析 |

### 设计系统（与 NGO_web 对齐）

| 要素 | 方案 |
|------|------|
| 主色 | Ukraine Blue (#076CB3) |
| CTA | Ukraine Gold (#F5B800) |
| 成功 | #10B981 (绿) |
| 警告 | #E76F51 (橙) |
| 标题字体 | Fraunces (衬线) |
| 正文字体 | Source Sans 3 (无衬线) |
| 数据字体 | JetBrains Mono (等宽) |
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
│       ├── projects/            # 项目展示
│       ├── donate/              # 捐赠页
│       ├── merch/               # 周边商品
│       ├── news/                # 新闻动态
│       └── partners/            # 合作伙伴
├── components/
│   ├── home/                    # 首页组件（HeroSection）
│   ├── layout/                  # 布局组件（Navigation, Footer, LoadingBar）
│   └── partners/                # 合作伙伴组件（PartnersShowcase）
├── data/
│   └── partners.json            # 合作伙伴数据
├── i18n/
│   ├── config.ts                # 语言配置（locales, defaultLocale）
│   ├── request.ts               # next-intl 请求配置
│   └── routing.ts               # next-intl 路由配置
├── lib/
│   └── utils.ts                 # cn() 工具函数
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

## 注意事项 (Gotchas)

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
