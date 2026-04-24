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
| 支付 | Stripe buy-button + monobank jar | 纯前端托管。Stripe：`<stripe-buy-button>` Web Component 嵌入（只用 publishable key，走 Stripe 托管 checkout；本站不持 secret / 不接 webhook / 不聚合 Stripe 金额）。monobank：外跳 `send.monobank.ua/jar/{sendId}` |
| KV 限流 | @upstash/redis | Vercel Marketplace KV，admin 登录速率限制跨实例共享（`Redis.fromEnv()` 读 `KV_REST_API_*`） |
| 数据库 | Neon Postgres (`@neondatabase/serverless`) | Vercel Marketplace 接入，存 news 表；serverless HTTP driver，无连接池管理 |
| Admin 安全 | node:crypto HMAC cookie | HttpOnly 签名 cookie 承载 admin 会话，不走第三方库（见 `src/lib/adminSession.ts`） |
| 事务邮件 | Resend (`resend`) | Admin 后台 `/admin/email`：手输收件人 + 模板渲染发送，模板注册表在 `src/lib/emailTemplates.ts`（server-only） |
| XSS 过滤 | isomorphic-dompurify | DocumentViewer 的 xlsx HTML 走 DOMPurify 过滤再 dangerouslySetInnerHTML |
| Focus trap | focus-trap-react | MobileMenuPanel / NewsLightbox 打开时锁键盘焦点在面板内 |

### 计划集成（尚未安装）

| 类型 | 技术 | 说明 |
|------|------|------|
| 监控 | Sentry | 错误追踪 |
| 分析 | Vercel Analytics | 流量分析 |

### 设计系统（与 NGO_web 对齐）

| 要素 | 方案 |
|------|------|
| 主色 | Logo 渐变: #006CB2 → #008DB8 → #00A7BD → #77C3CD → #DCDCDC |
| CTA | Ukraine Gold (#F5B800) |
| 成功 | #10B981 (绿) |
| 警告 | #E76F51 (橙) |
| 主字体 | **Fixel Text** (无衬线，MacPaw 开源乌克兰字体，自托管在 `public/fonts/fixel/`) — 同时承担正文 (`--font-body`) 和标题 (`--font-display`)，靠权重区分 (400/500/600/700；ExtraBold 已移除，全部标题封顶 Bold) |
| 辅助衬线字体 | **PT Serif** (Google Fonts，替代品牌规范中的 Sitka Text) — 用于装饰性标题点缀 (`--font-accent`)，不用于大段正文 |
| 数据字体 | **JetBrains Mono** (等宽，`--font-data`) — 用于数字、标签、序号 |
| 图标 | Lucide React |
| 工具 | clsx + tailwind-merge → `cn()` |

---

## 支付方案（Stripe buy-button + monobank jar，无数据库、无 webhook）

项目**不使用数据库**、**不接 webhook**、**不持有 Stripe secret key**。捐赠通过 Stripe buy-button 和 monobank jar 两条独立通道收款，只有 monobank 能读到金额（`/personal/client-info`），Stripe 侧我们不聚合。

### 核心流程

DonationSidebar 是一个**双视图状态机**（method ↔ stripe），顶部进度区（raised / goal / %）常驻，不随视图切换。`direction: 'forward' | 'backward'` 驱动 `animate-panel-forward` / `animate-panel-backward` 入场过渡。

```
Step 1 · method 视图（默认）
  进度条（raised / goal）
  ─ 分隔线 ─
  "Choose payment method" + 项目徽章
    ├─ monobank 按钮 <a href>
    │     项目 data.json 配了 monobankJarSendId → send.monobank.ua/jar/{项目 sendId}
    │     否则 fallback 到 NEXT_PUBLIC_MONOBANK_FALLBACK_JAR_SEND_ID
    │     都没 → 按钮灰态 "Coming soon"
    │     （新 tab 打开；用户在 monobank 页面输入金额）
    │
    └─ stripe 按钮 → setView('stripe'), direction='forward'
Step 2 · stripe 视图
  ← Back      02/02
  Stripe logo + 项目徽章
  <stripe-buy-button> Web Component 嵌入
    - 加载 https://js.stripe.com/v3/buy-button.js (afterInteractive)
    - buy-button-id + publishable-key 写死在 src/components/projects/donation/utils.ts
    - 用户点按钮 → Stripe 托管 checkout 页付款（我们不收回调）
```

### 已筹金额展示

`src/lib/donations.ts` 的 `getRaisedAmount(projectId)` 只聚合 **monobank jar**：`src/lib/monobank.ts` 调 `/personal/client-info`（`X-Token: MONOBANK_TOKEN`）拉所有 jar，`unstable_cache` 60s 缓存（正好匹配官方"1 次/60s"限流），按 `sendId` 匹配 `project.monobankJarSendId` 取 `balance / 100`。

Stripe 付款不计入 `raised_amount`（无 webhook / 无 secret key，查不到），这是刻意权衡。任一环节失败降级为 0，不阻塞渲染。

### 项目/商品数据

不走数据库，走静态文件 + TypeScript 常量：
- `public/data/projects/{id}/data.json` + `cover.webp` + `gallery/*`
- `public/data/projects/index.json` — 列表 + 排序 + `active` 开关
- `src/data/projects.ts` — `PROJECTS` 常量（id 白名单，编译期类型检查）
- `src/lib/data.ts` — `getProject(id)` / `getAllProjects()`（`react.cache` 请求级去重）

### 有意省略的能力

下面这些能力**不提供**，如未来需要再引入数据库 / webhook：
- 捐赠者留言 / 公开捐赠墙
- Admin 后台（订单列表、状态机、发货跟踪）
- 月捐（订阅）
- 商品购买的收货地址、快递单号
- 支付成功页（没有 webhook 就没有可靠成功信号）
- Stripe 金额聚合到 raised_amount
- 邮件通知（Resend 未接入）

### 环境变量

```env
MONOBANK_TOKEN=                          # 基金会账户的 monobank personal token（api.monobank.ua 自助生成）
NEXT_PUBLIC_MONOBANK_FALLBACK_JAR_SEND_ID= # 基金会主 jar 的 sendId；项目无 monobankJarSendId 时 fallback 到这个
```

- `MONOBANK_TOKEN` 缺失时 `getRaisedAmount` 返回 0，不报错
- `NEXT_PUBLIC_MONOBANK_FALLBACK_JAR_SEND_ID` 让支付方式面板里的 monobank 按钮始终可点（项目自己的 sendId 缺失时跳 fallback jar）；两者都缺失时 monobank 按钮显示 "Coming soon" 灰态

---

## 新闻系统（Neon Postgres + Vercel Blob）

News 页面是 Twitter 风格的双语时间线 (`/[locale]/news`)，配独立 admin 后台 (`/admin/news`)：

**文案存储（Neon Postgres）**：单张表 `news`，走 `@neondatabase/serverless` 的 HTTP driver，server action 里 INSERT / DELETE 后立即 `revalidateTag('news')` 失效前端 60s 缓存 —— 无需等 Vercel 重建，秒级生效。Schema：

```sql
CREATE TABLE news (
  id           TEXT PRIMARY KEY,                   -- YYYY-MM-DD-HHmm-xxxx
  published_at TIMESTAMPTZ NOT NULL,
  title        JSONB NOT NULL,                     -- {"ua":"...","en":"..."}
  body         JSONB NOT NULL,                     -- {"ua":"...","en":"..."}
  images       TEXT[] NOT NULL DEFAULT '{}',       -- Vercel Blob URL 数组
  tags         JSONB NOT NULL DEFAULT '[]'::jsonb  -- [{"ua":"...","en":"..."}, ...]
);
CREATE INDEX idx_news_published ON news (published_at DESC);
```

Tag 规范（`normalizeTags` in `src/app/actions/news.ts`）：单条新闻最多 6 个 tag，每个字段最长 30 字符，按 `en.toLowerCase()` 去重。前台 `/[locale]/news?tag=<en>` 过滤 —— en 字段稳定作 URL slug，语言切换时 filter 保留。

读取 (`src/lib/news.ts`) 走 `unstable_cache(..., { revalidate: 60, tags: ['news'] })`；管理员写 (`src/app/actions/news.ts`) 走 `sql` tagged template，`published_at / title / body / images / tags` 用 `::timestamptz / ::jsonb / ::text[] / ::jsonb` 显式 cast。

**图片存储（Vercel Blob）**：admin 选图后，浏览器通过 `@vercel/blob/client` 的 `upload()` **直接上传到 Blob**（绕开 server action 4.5MB body 限制），拿到完整 URL 后写入 DB `images` 列。前端 `next/image` 直接用 Blob URL 加载（已在 `next.config.ts` `images.remotePatterns` 里允许 `*.public.blob.vercel-storage.com`）。

**Admin 认证流（HttpOnly 签名 cookie）**：
1. 用户在 `/admin/*` 的登录表单提交密码 → `POST /api/admin/login`
2. `verifyAdminPassword(pw)`（`src/lib/adminAuth.ts`）— SHA-256(pw+SALT) 常数时间比对 `ADMIN_PASSWORD_HASH`，同时按 IP 走 `rateLimit()`
3. 通过 → `issueSession()` 发一张 HttpOnly + Secure + SameSite=Strict 的 cookie `wth_admin`，值为 `base64url(payload).base64url(HMAC-SHA256(ADMIN_COOKIE_SECRET, payload))`，8 小时滑动过期
4. 后续所有 server action 和 `/api/news/upload` 调 `requireAdmin()`（`src/lib/adminSession.ts`）读 cookie + 验签；失败抛 `unauthorized`
5. `/api/admin/logout` 清 cookie；`/api/admin/me` 供前端探活

**Blob client upload 流程**：
1. 客户端 `upload()` POST 到 `/api/news/upload`（不传密码，身份由 cookie 承载）
2. `onBeforeGenerateToken` 调 `getSession()` 验 cookie；验 `pathname` 前缀为 `news/`；限 MIME 为 jpeg/png/webp；限 size ≤ 8MB
3. 返回短时 upload token → 客户端拿 token 直传 Blob → 得到 URL
4. 所有 URL 一起提交给 `publishNewsAction`（同样走 `requireAdmin()`）→ INSERT 进 Neon + `revalidateTag('news', { expire: 0 })`

**速率限制（@upstash/redis）**：`src/lib/adminRateLimit.ts` 用 `Redis.fromEnv()` 跨实例共享计数器。key: `admin:fail:{ip}`（ZSET 记失败时间戳，TTL = 窗口 + 60s）+ `admin:lock:{ip}`（String + TTL 30min）。15 分钟窗口 10 次失败触发 30 分钟锁定。KV 不可用时 fallback 到进程内 Map（开发环境 / 未接 KV 的部署）。

**删除**：`deleteNewsAction` 一条 SQL `DELETE FROM news WHERE id = $1 RETURNING images` 拿到要清理的图，成功后 `revalidateTag('news')`，然后异步调 `@vercel/blob` 的 `del(urls)` 清理 Blob。Blob 清理失败不回滚（DB 已删），只记日志；极少数 orphan 图可由 sweeper 后续扫。

**密码工具**：`node scripts/gen-admin-hash.mjs <password>` 一次性输出配对的 `ADMIN_PASSWORD_HASH` / `ADMIN_PASSWORD_SALT` / `ADMIN_COOKIE_SECRET` 三个 env var。改密码必须同时更新前两个；cookie secret 一般不需要轮换，除非怀疑泄露。

**Admin 不走 i18n**：`/admin/news` 在 app router 根目录（不是 `[locale]/admin`），有独立 `src/app/admin/layout.tsx`（共享字体从 `src/app/fonts.ts`）。页面内容全英文硬编码，不使用 `useTranslations`。

### 新闻相关环境变量

```env
# Neon Postgres（Vercel Marketplace 装 Neon 后自动注入一整套；我们只用 DATABASE_URL）
DATABASE_URL=                     # postgres://...pooler.../neondb?sslmode=require

# Vercel Blob（图片上传）
BLOB_READ_WRITE_TOKEN=            # Vercel Blob store token（Vercel 自动注入于部署环境，本地需手动复制）

# Admin 密码 / 会话
ADMIN_PASSWORD_HASH=              # SHA-256(password + SALT)，64 位 hex；必需
ADMIN_PASSWORD_SALT=              # 必需；任意随机字符串（用脚本自动生成）。HASH 与 SALT 必须配对，改一个就得同步改另一个
ADMIN_COOKIE_SECRET=              # 必需；≥32 字节 base64url 随机，用于 HMAC 签 admin 会话 cookie。轮换会让所有现有 cookie 立即失效

# Upstash Redis（限流，由 Vercel Marketplace KV integration 自动注入到生产/预览）
KV_REST_API_URL=                  # Upstash REST endpoint
KV_REST_API_TOKEN=                # Upstash REST token
# 未配置时 adminRateLimit 自动 fallback 到进程内 Map（开发环境可不配）
```

---

## 邮件系统（Resend + 静态 HTML 模板）

Admin 后台 `/admin/email`：手动输入收件人 + 选择模板 + 预览 + 发送，走 Resend API。

**架构刻意简单**：模板都是**静态 HTML 常量**，subject / html / text 三件套写死在 TS 文件里。**没有参数化、没有变量填充、没有运行时字符串拼接**。换一个内容 = 加一个新模板文件。这个决定是为了：
1. 避免被当开放邮件发射器用（所有发件内容都已在代码 review 阶段审过）
2. 完整保留设计师给的 HTML（乌克兰语排版 / `@import` 字体 / 内嵌 CSS / flexbox 布局）不被 escape 污染
3. 零渲染逻辑 = 零注入面

**模板注册表**（`src/lib/emailTemplates.ts`，`server-only`）：`TEMPLATES` 数组，每项 `{ id, name, description, locales, rendered: { subject, html, text } }`。当前内置：

- `partnership-invite-ua` — 合作伙伴冷启动邀约信（乌克兰语），源文件 `src/lib/emailTemplates/partnershipInviteUa.ts`

**加新模板的步骤**：
1. 在 `src/lib/emailTemplates/<name>.ts` 导出三个常量：subject / html / text
2. 在 `emailTemplates.ts` 的 `TEMPLATES` 数组追加一项
3. 如 HTML 里有图片，用绝对 URL（`https://waytohealth.org.ua/email/xxx.png`），不要 base64 —— 内嵌 >100KB 会被 Gmail "Message clipped" 截断。图片放 `public/email/`，通过生产域名拉

**发送流程**（`src/app/actions/email.ts`）：
1. 所有 action 入口 `requireAdmin()`（admin cookie 会话）
2. `parseRecipients(raw)` — 按换行（`\r?\n`）拆分，正则校验 RFC 结构，去重，单次上限 50（Resend 限制）。UI placeholder 与 hint 都是 "One address per line"，避免地址内 `+ . _` 被误切
3. `renderEmail(templateId)` — 从 `BY_ID` map 取出常量三件套
4. `resend.batch.send(messages, { batchValidation: 'permissive' })` — 把收件人列表展开成 N 封独立邮件（每封 `to: [addr]`），单封触发反垃圾不影响其余成功投递。**不**用 `to=from + bcc` 群发：`Mail-from = Rcpt-to` 是经典垃圾邮件特征，Gmail/Outlook 实测整封 bounced。每封独立寄出本身就互不可见，等同 bcc 隐私维度。`permissive` 模式返回 `data.errors[].index`，按下标映射回原列表的邮箱地址组成 `failures: { address, message }[]` 回给前端展示；`replyTo` 单独再校验一次邮箱格式

`previewEmailAction(templateId)` 只返回模板常量用于 UI 预览，不调 Resend。

**UI**（`src/components/admin/EmailPanel.tsx`）：双栏布局，左侧表单（收件人 textarea / 模板下拉 / From 前缀下拉 / Advanced subject override + reply-to），右侧 iframe 预览（`sandbox="allow-same-origin"`）。底部 `EmailHistory` 调 `listEmailHistoryAction` 拉 Resend `emails.list({ limit: 100 })` 显示最近发送记录（时间 / 主题 / 收件人 / `last_event` 状态），发送成功后通过 `refreshKey` bump 自动刷新。

**发件人地址**（`src/lib/emailFrom.ts`）：display name `Way to Health` 和域名 `waytohealth.org.ua` 写死成项目常量；本地部分走白名单 `FROM_PREFIXES = ['info', 'support', 'news', 'noreply']`，admin UI 下拉选择（默认 `noreply`），`buildFromAddress(prefix)` 拼成完整 from 串。故意不开"任意前缀"：写死能发的地址集合 = 发件内容已在 code review 阶段审过，和静态 HTML 模板是同一套"不接受运行时输入"的护栏。所有可选前缀的本地邮箱（`info@` / `support@` / `news@` / `noreply@`）域名必须已经在 Resend 控制台验证通过，否则 send 会 403。Inbound webhook 转发默认走 `noreply`。

### Inbound 邮件转发（catch-all → Gmail）

任何发到 `*@waytohealth.org.ua` 的邮件都会被 Resend Inbound 接收后调 webhook，由 `src/app/api/webhooks/resend-inbound/route.ts` 转发到 `FORWARD_TO_EMAIL` 指定的 Gmail。

**链路**：DNS 根域 MX → `inbound-smtp.eu-west-1.amazonaws.com`（Resend 控制台 Domains 详情页底部 Enable Receiving 后 UI 给） → Resend 收到后 POST 到 `/api/webhooks/resend-inbound`（事件类型 `email.received`）→ svix 签名校验通过后，用 `resend.emails.send()` 原样转发到目标 Gmail。

**路由关键点**：
1. `runtime = 'nodejs'` + `maxDuration = 60`：svix 校验依赖 Node crypto，Edge runtime 会炸；带附件的大邮件串行走 Resend API 可能超过默认 timeout，保守拉到 60s
2. **只处理 `email.received`** 事件，其他事件类型 200 OK 跳过（为将来 Resend 扩事件类型留余地）
3. **反查正文**：webhook payload 只给 metadata，必须调 `resend.emails.receiving.get(emailId)` 拉 `html / text / headers / attachments[]`
4. **入站 HTML 经 sanitize-html**（不是 DOMPurify —— jsdom 在 Vercel serverless 起不来）：白名单保留表格 / 内嵌 style / `<img src="cid:…">` 等样式承载标签，剥所有 `on*` handler、`script/iframe/form/meta/style/object/embed` 等，`<a>` 强制 `target=_blank rel=noopener noreferrer`
5. **附件完整转发（含 inline CID）**：`detail.attachments` 只有 metadata，对每项再调 `receiving.attachments.get({ emailId, id })` 拿 `download_url`，下载 → base64 → 以 `{ filename, content, contentType, contentId }` 形式附到出站 send。`contentId` 保留让原 `<img src="cid:xxx">` 引用在 Gmail 里正常渲染为行内图。Promise.all 并行下载，单附件失败（超时 / 404 / metadata 不完整）只丢该附件，不阻塞其他附件和正文转发。累计附件超 30MB（Resend 40MB 硬限的保险线）就丢弃尾部剩余附件
6. **`replyTo` 要校验邮箱格式**：Resend `from` 字段理论上可能带展示名或异常字符，不是合法单邮箱就不设 `replyTo`；否则 Resend API 会 400
7. **subject 单行化 + 截断**：入站 subject 可能带 `\r\n`（header 注入）或极长字符串，统一 `sanitizeHeader(subject, 200)`
8. **发件人固定为自己域名**（`buildFromAddress()`，默认前缀 `noreply`），原发件人地址渲染在正文顶部 meta 块里（From / To / Cc / Subject / Date）。不要用 `from: <原发件人>` —— 会 DMARC fail + 被 Gmail 判为伪造
9. **断转发回环（四层）**：(a) 发件人域名是 `waytohealth.org.ua` 或其子域直接跳过（最可靠，兜 bounce / auto-reply 绕回）；(b) subject 已带 `[Forwarded]` 前缀跳过（人类可读信号）；(c) 原邮件 `headers` 含 `X-Forwarded-By: waytohealth.org.ua` 跳过——我们自己出站 send 时会打这个标，即便对方把完整 header 回流也能识别；(d) 出站 subject 必带 `[Forwarded]` 前缀 + headers 必带 `X-Forwarded-By`，构成下一次入站的识别依据

**所需环境变量**：

```env
RESEND_WEBHOOK_SECRET=            # Resend 控制台 Webhooks → Add Webhook 勾 email.received 后给的 whsec_... Signing Secret；仅显示一次
FORWARD_TO_EMAIL=                 # 转发目标 Gmail，如 waytohealthua@gmail.com
```

两个 env var 任一缺失 route 返回 500 `Webhook not configured`。签名校验失败 401、payload 结构异常 400、Resend 转发失败 502、其他异常 500 —— Resend 会按状态码自动重试。

### 邮件相关环境变量

```env
RESEND_API_KEY=                   # Resend dashboard → API Keys 生成；必需
RESEND_WEBHOOK_SECRET=            # Inbound 邮件 webhook 签名密钥，见上文 Inbound 小节
FORWARD_TO_EMAIL=                 # Inbound 邮件转发目标 Gmail，见上文 Inbound 小节
```

> 发件人地址不走 env —— display name / 域名 / 可用前缀都在 `src/lib/emailFrom.ts` 定义。admin 发信时从白名单下拉选前缀。

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
│   │   ├── news/page.tsx        # News 管理后台
│   │   └── email/page.tsx       # Email 发送后台（Resend）
│   ├── api/
│   │   ├── admin/{login,logout,me}/  # 签名 cookie 发放 / 清除 / 探活
│   │   ├── news/upload/              # Vercel Blob client upload handler
│   │   └── webhooks/resend-inbound/  # Resend Inbound webhook：catch-all 邮件转发到 Gmail
│   ├── sitemap.ts               # 11 项目 × 2 locale + 静态页
│   ├── robots.ts                # 允许 / ，禁 /admin /api
│   └── [locale]/                # 国际化路由（前台）
│       ├── layout.tsx           # locale layout（NextIntlClientProvider + Nav/Footer）
│       ├── page.tsx             # 首页
│       ├── about/               # 关于我们
│       ├── projects/            # 项目详情（/projects?id=N）
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
│   ├── useBodyScrollLock.ts     # 锁定页面滚动（Modal、BottomSheet 等场景，模块级栈化）
│   ├── useEscapeKey.ts          # ESC 键关闭通用 hook
│   └── useInViewOnce.ts         # 滚动入场检测（共享 IntersectionObserver，HMR 安全）
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
│   ├── news.ts                  # News admin（cookie session + SQL CRUD + Blob 图清理）
│   └── email.ts                 # Email admin（cookie session + 模板渲染 + Resend 发送 + 历史拉取）
├── lib/
│   ├── utils.ts                 # cn() 工具函数
│   ├── resend.ts                # Resend 客户端单例（server-only），re-export emailFrom 的工具
│   ├── emailFrom.ts             # 发件人常量：display name / 域名 / 前缀白名单 / buildFromAddress（client-safe）
│   ├── emailTemplates.ts        # 邮件模板注册表（server-only，纯静态 HTML，无变量）
│   ├── emailTemplates/          # 每个模板单独一个 .ts，导出 subject / html / text 三常量
│   ├── donations.ts             # 已筹金额查询（带缓存）
│   ├── news.ts                  # 新闻读取（从 Neon SELECT，带 unstable_cache）
│   ├── db.ts                    # Neon Postgres 单例（`@neondatabase/serverless`）
│   ├── fetchWithTimeout.ts      # AbortSignal.timeout 封装（monobank 等对外调用）
│   ├── seo.ts                   # SEO helper：canonical / hreflang / openGraph / twitter
│   ├── adminAuth.ts             # 管理员密码 hash 校验（server-only）
│   ├── adminSession.ts          # HMAC-SHA256 签名 cookie 会话发放/验证/清除
│   └── adminRateLimit.ts        # 管理员登录 IP 速率限制（@upstash/redis，fallback 进程内 Map）
└── proxy.ts                     # i18n 路由中间件（Next.js 16 起用 proxy.ts 替代 middleware.ts）
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
  - `glow-teal` / `glow-blue` / `glow-blue-soft` / `glow-gold` / `glow-gold-soft` — 装饰光晕背景（小面积）
  - `aura-cyan-xl` / `aura-blue-lg` / `aura-gold-lg` / `aura-teal-md` — 装饰性巨型光源（区块背景，避免 JSX 写 radial-gradient）
  - `ambient-canvas` — main 容器的连续天光氛围（渐变主背景 + ::before noise 叠层）
  - `animate-hero-title` / `animate-hero-cta` — Hero 专属入场动画（错峰触发）
  - `animate-panel-forward` / `animate-panel-backward` — DonationSidebar 多视图状态机切换动画
  - `animate-rate-pop` — EUR 换算徽章出现动效
  - `gradient-brand-deep` — 深色 CTA 卡片（白字高对比）
  - `gradient-brand-circle` — 品牌圆形渐变（RecoveryJourney 小圆球图标）
  - `text-stroke-gold` — 金色半透明描边文字（about 大字装饰）
  - `dot-matrix-blue` — 蓝色点阵背景（通过 `--dot-size` 变量可覆写间距）
  - `mask-fade-right` — 右侧淡出遮罩（依赖父级 `--cta-w` 变量）
  - `writing-vertical` — 垂直竖排文字
- **页面内容容器**统一使用 `container-page` 类（max-w-7xl + 响应式内边距），不要手写 `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **纵向区块间距**统一使用 `section-y` 类（py-6 / py-8 响应式）
- **区域标题装饰线**统一使用 `accent-line` 类
- **隐藏滚动条**统一使用 `hide-scrollbar` 类，不要写 `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
- **动画降级**：`globals.css` 末尾已全局响应 `prefers-reduced-motion: reduce`，不要在组件里重复写降级逻辑
- Tailwind 颜色使用 `@theme` 中定义的语义化 token（如 `text-ukraine-blue-500`），不要用十六进制；`globals.css` 里定义工具类时用 `var(--color-ukraine-blue-*)`，不要硬编码 hex

### TypeScript

- **Locale 类型**：从 `@/i18n/config` 导入 `toLocale(v)` 或 `isLocale(v)` 守卫，禁止用 `as Locale` / `as 'ua' | 'en'` 断言。`useLocale()` / `getLocale()` / `params.locale` 的返回值都走 `toLocale()` 窄化
- 保持 `strict: true`，避免 `any`
- **JSON 数据文件**必须有对应的 `.ts` 文件提供类型定义和类型化导出（如 `partners.json` → `partners.ts`），组件中导入类型化版本而非直接导入 JSON
- **禁止 `as` 类型断言绕过类型检查**，应通过接口定义正确的类型；对 `t.raw()` 等返回 unknown 的 API，写手动 guard 函数（见 `about/page.tsx` 的 `toTeamMember` / `toDocumentItem`）

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
- 锁定 body 滚动用 `useBodyScrollLock(isLocked)`，禁止直接写 `document.body.style.overflow = 'hidden'`（会和 hook 内的栈化计数器冲突）
- ESC 关闭弹层用 `useEscapeKey(active, onEscape)`，不要每个组件各自绑 `keydown`
- `matchMedia` 断点检测用 `useSyncExternalStore`（避免 `useEffect` + setState 级联渲染告警），参考 `BottomSheet.tsx` / `MobileDonationSheetMount.tsx`

### 安全 / 外部调用

- 所有对外 API 调用走 `fetchWithTimeout(url, init, timeoutMs)`，不要直接 `fetch` 外部地址（否则悬挂请求会阻塞 server action / ISR）
- 任何 `dangerouslySetInnerHTML` 必须经 `isomorphic-dompurify` 的 `DOMPurify.sanitize()`
- 任何 `<iframe src>` 加 `sandbox` 属性（最少 `allow-same-origin`，PDF 预览用 `allow-same-origin allow-scripts allow-downloads allow-popups`）
- Admin server action / API route 不接受 `pw` 参数，一律 `await requireAdmin()` 从 cookie 取身份

### Button / a11y

- 所有 `<button>` 必须有 `type="button"`（除非确实要 submit），否则在 `<form>` 内会误触发提交
- 弹层组件（drawer / lightbox / modal）用 `<FocusTrap>`（focus-trap-react）包裹，打开时锁键盘焦点
- `<input>` 必须配 `<label htmlFor>` 或 `aria-label`

---

## 注意��项 (Gotchas)

- **Tailwind v4**: 使用 CSS-first 配置（`@import "tailwindcss"`），不再有 `tailwind.config.js`。自定义主题通过 `globals.css` 中的 `@theme` 定义
- **Next.js 16 异步 API**: `cookies()`、`headers()`、`params`、`searchParams` 都需要 `await`
- **路由中间件**: 文件位于 `src/proxy.ts`（Next.js 16 起用 `proxy.ts` 替代 `middleware.ts`，使用旧名会触发弃用警告），仅用于 next-intl 路由
- **默认语言**: `ua`（乌克兰语）是默认语言，不是 `en`
- **翻译键同步**: 添加新 UI 文案时，`ua.json` 和 `en.json` 必须同时更新
- **SEO metadata**: 新页 `generateMetadata` 走 `src/lib/seo.ts` 的 `buildAlternates` / `buildOpenGraph` / `buildTwitter` helper，不要手写 canonical / hreflang / OG；新路径记得加到 `src/app/sitemap.ts`
- **KV 连接**：生产用 Vercel Marketplace KV（Upstash），SDK 是 `@upstash/redis`（**不要**装 `@vercel/kv`，已 deprecated）。`Redis.fromEnv()` 自动读 `KV_REST_API_URL` / `KV_REST_API_TOKEN`
- **OG 图**: `public/og-image.jpg`（1200×630，≤ 200KB），由 `lib/seo.ts` 默认引用。替换时保持尺寸与路径

---

## 交流语言

- 始终使用中文与用户交流
- 代码注释使用中文
- Git commit message 使用中文
