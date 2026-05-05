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
npm run dev      # 开发服务器（绑 0.0.0.0:3000 局域网可访问；3s 后自动开浏览器 tab）
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
| Focus trap | focus-trap-react | MobileMenuPanel / Lightbox 打开时锁键盘焦点在面板内 |

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

## 支付方案（Stripe buy-button + monobank jar，无 webhook）

捐赠通过 Stripe buy-button 和 monobank jar 两条独立通道收款。本站**不持 Stripe secret key、不接任一通道的 webhook、不直接查任一通道余额**：已筹金额由 admin 手动维护（见下文「已筹金额展示」）。

### 核心流程

DonationSidebar 是 method ↔ stripe **双视图状态机**，顶部进度区（raised / goal / %）常驻不随视图切换；`direction: 'forward' | 'backward'` 驱动 `animate-panel-forward` / `animate-panel-backward` 过渡。

- **method 视图** 放 monobank / stripe 两个按钮。monobank 按钮是纯 `<a href>` 跳 `send.monobank.ua/jar/{sendId}`（新 tab 里用户自己输金额）：用项目 `data.json` 的 `monobankJarSendId`，缺失就灰态 "Coming soon"。
- **stripe 视图** 嵌入 `<stripe-buy-button>` Web Component，`buy-button-id` + `publishable-key` 写死在 `src/components/projects/donation/utils.ts`；`https://js.stripe.com/v3/buy-button.js` 用 `afterInteractive` 加载。用户点按钮跳 Stripe 托管 checkout，本站**不收回调**。

### 已筹金额展示（admin 手动维护）

monobank 慈善基金会的 jar 走法人 API（providers，要 RSA 签名 + 客户端授权流），对一个"显示进度"的需求工作量过重；Stripe 也没接 webhook。**所以已筹金额不自动聚合**，由 admin 在 `/admin/amounts` 人工录入：

- 单张 Neon 表 `project_amounts (project_id, raised_uah, updated_at)` 存每个项目的当前已筹（UAH 整数）
- 流程：管理员看法人 mono business app 的 jar 余额 + Stripe dashboard，把合计数填进表单 → server action 批量 UPSERT + `revalidateTag('project-amounts')`，前台 60s 内刷新
- 前台读：`src/lib/projectAmounts.ts` 的 `getAllProjectAmounts()` 一次拉整张 map（`unstable_cache(60s, tags:['project-amounts'])`），首页 `ProjectsSection` / 详情页 `projects/page.tsx` 用 `projectId → raised` 查，缺记录 / DB 不可用降级为 0，不阻塞渲染
- 项目静态 JSON `public/data/projects/{id}/data.json` **不再含 `raised_amount`**（已废，类型 `ProjectData` 也不含）；展示组件用派生类型 `ProjectWithRaised = ProjectData & { raised_amount: number }`，由 SSR 阶段拼装

更新频率：基金会每周 / 双周对账后登 admin 改一次即可。慈善网站的进度展示对实时性不敏感，这个粒度足够。

### 项目/商品数据

不走数据库，走静态文件 + TypeScript 常量：
- `public/data/projects/{id}/data.json` + `cover.webp` + `gallery/*`
- `public/data/projects/index.json` — 列表 + 排序 + `active` 开关
- `src/data/projects.ts` — `PROJECTS` 常量（id 白名单，编译期类型检查）
- `src/lib/data.ts` — `getProject(id)` / `getAllProjects()`（`react.cache` 请求级去重）

### 有意省略的能力

下面这些能力**不提供**，如未来需要再引入 webhook / 法人 API：
- 实时聚合 monobank jar / Stripe 金额到 `raised_amount`（当前由 admin 人工录入）
- 捐赠者留言 / 公开捐赠墙
- Admin 后台（订单列表、状态机、发货跟踪）
- 月捐（订阅）
- 商品购买的收货地址、快递单号
- 支付成功页（没有 webhook 就没有可靠成功信号）

### Schema（需在 Neon console 一次性执行）

```sql
CREATE TABLE project_amounts (
  project_id  INT PRIMARY KEY,
  raised_uah  BIGINT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

注：项目 `data.json` 没填 `monobankJarSendId` 时，捐赠面板的 monobank 按钮显示 "Coming soon" 灰态。

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

**图片存储（Vercel Blob）**：admin 选图后，浏览器先用 canvas 转码成 webp（最长边 ≤ 2400px，质量 0.85，HEIC/HEIF 直接拒绝；见 `src/components/admin/news/imageTransform.ts`），再通过 `@vercel/blob/client` 的 `upload()` **直接上传到 Blob**（绕开 server action 4.5MB body 限制），拿到完整 URL 后写入 DB `images` 列。前端 `next/image` 直接用 Blob URL 加载（已在 `next.config.ts` `images.remotePatterns` 里允许 `*.public.blob.vercel-storage.com`）。客户端转码失败（极少数浏览器 / 损坏图）会在选图阶段就把错误聚合给 admin，不会带病走到上传。

**Admin 认证**：`POST /api/admin/login` 调 `verifyAdminPassword`（SHA-256(pw+SALT) 常数时间比对 + IP 限流），通过后 `issueSession()` 发 HttpOnly + Secure + SameSite=Strict 的 `wth_admin` cookie（HMAC-SHA256 签名，8h 滑动过期）。所有 admin server action / API route **必须 `await requireAdmin()`** 读 cookie + 验签，失败抛 `unauthorized`。配套路由：`/api/admin/logout` 清 cookie，`/api/admin/me` 供前端探活。

**Blob client upload**：客户端 `upload()` → `/api/news/upload`（`onBeforeGenerateToken` 验 cookie + `pathname` 前缀 `news/` + MIME 白名单**仅 webp**（客户端转码后必为 webp，curl 直传等绕过路径作为双层护栏挡掉）+ size ≤ 8MB）→ 拿短时 token 直传 Blob → 得到 URL 提交给 `publishNewsAction` INSERT + `revalidateTag('news', { expire: 0 })`。绕开了 server action 4.5MB body 限制。

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

**发送流程**（`src/app/actions/email.ts`）：`requireAdmin()` → `parseRecipients`（换行拆分 + RFC 正则 + 去重，单次上限 50）→ 取模板常量 → `resend.batch.send(messages, { batchValidation: 'permissive' })` 把收件人展开成 N 封独立邮件（每封 `to: [addr]`），单封被反垃圾拦截不影响其余。`permissive` 返回 `data.errors[].index`，按下标映射成 `failures: { address, message }[]` 回给前端。**不用 `to=from + bcc` 群发** —— `Mail-from = Rcpt-to` 是经典垃圾邮件特征，实测 Gmail/Outlook 整封 bounced；独立寄出天然等同 bcc 隐私维度。`previewEmailAction` 只返常量不调 Resend。

**UI**（`src/components/admin/EmailPanel.tsx`）：左栏表单（收件人 textarea / 模板下拉 / From 前缀下拉 / Advanced subject override + reply-to）+ 右栏 iframe 预览（`sandbox="allow-same-origin"`）。底部 `EmailHistory` 拉 Resend `emails.list({ limit: 100 })`，发送成功后 `refreshKey` bump 自动刷新。

**发件人地址**（`src/lib/emailFrom.ts`）：display name `Way to Health` 和域名 `waytohealth.org.ua` 写死成项目常量；本地部分走白名单 `FROM_PREFIXES = ['info', 'head', 'support', 'news', 'noreply']`，admin UI 下拉选择（默认 `info`），`buildFromAddress(prefix)` 拼成完整 from 串。故意不开"任意前缀"：写死能发的地址集合 = 发件内容已在 code review 阶段审过，和静态 HTML 模板是同一套"不接受运行时输入"的护栏。所有可选前缀的本地邮箱（`info@` / `head@` / `support@` / `news@` / `noreply@`）域名必须已经在 Resend 控制台验证通过，否则 send 会 403。Inbound webhook 转发显式走 `noreply`（不复用 admin 默认）。

### Inbound 邮件转发（catch-all → Gmail）

任何发到 `*@waytohealth.org.ua` 的邮件都会被 Resend Inbound 接收后调 webhook，由 `src/app/api/webhooks/resend-inbound/route.ts` 转发到 `FORWARD_TO_EMAIL` 指定的 Gmail。

**链路**：DNS 根域 MX → `inbound-smtp.eu-west-1.amazonaws.com`（Resend 控制台 Domains 详情页底部 Enable Receiving 后 UI 给） → Resend 收到后 POST 到 `/api/webhooks/resend-inbound`（事件类型 `email.received`）→ svix 签名校验通过后，用 `resend.emails.send()` 原样转发到目标 Gmail。

**关键约束（非自明部分）**：

- **`runtime = 'nodejs'` + `maxDuration = 60`** — svix 校验依赖 Node crypto（Edge 起不来）；带附件大邮件走串行 Resend API 会超默认 timeout
- **HTML 走 `sanitize-html`（不是 DOMPurify）** —— jsdom 在 Vercel serverless 起不来。白名单保留表格 / 内嵌 style / `<img src="cid:…">`，剥 `on*` / `script/iframe/form/meta/style/object/embed`，`<a>` 强制 `target=_blank rel=noopener noreferrer`
- **发件人必须固定为自己域名**（webhook 显式 `buildFromAddress('noreply')`），原发件人放正文 meta 块里。用 `from: <原发件人>` 会 DMARC fail 被 Gmail 判伪造
- **subject 必须 `sanitizeHeader(subject, 200)`** —— 入站可能带 `\r\n`（header 注入）或极长字符串
- **`replyTo` 要校验邮箱格式** —— Resend 原 `from` 可能带展示名或异常字符，非合法邮箱就不设，否则 Resend API 400
- **附件单独再调 `receiving.attachments.get()`** 拿 `download_url`（attachments metadata 不够）→ 下载 base64 → 带 `contentId` 附给出站，让 `<img src="cid:xxx">` 在 Gmail 继续渲染。`Promise.all` 并行，单附件失败只丢自己；累计 >30MB（Resend 40MB 硬限保险线）丢尾部
- **防转发回环（四层）**：(a) 发件人域名是 `waytohealth.org.ua` 子域直接跳过；(b) subject 已带 `[Forwarded]` 前缀跳过；(c) 原 headers 含 `X-Forwarded-By: waytohealth.org.ua` 跳过；(d) 出站必打 `[Forwarded]` + `X-Forwarded-By` —— 前三条是识别层，最后一条是下一次入站的标记源
- 只处理 `email.received` 事件，其他类型 200 OK 跳过（为 Resend 扩事件留空间）

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

## 表单系统（Request Assistance / Partnership）

两张从原 Google Form 搬过来的前台表单 —— `/[locale]/request-assistance` 和 `/[locale]/partnership`。提交落到 Neon Postgres，admin 后台 `/admin/requests`、`/admin/partnerships` 只读查看。两张表单刻意不发邮件、不发通知（避免多入口维护），基金会团队每周登 admin 翻。

**Schema（需在 Neon console 一次性执行）**：

```sql
CREATE TABLE assistance_requests (
  id           TEXT PRIMARY KEY,              -- ar-YYYY-MM-DD-HHmm-xxxx
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locale       TEXT NOT NULL,                 -- 'ua' | 'en'
  data         JSONB NOT NULL                 -- AssistanceRequestData
);
CREATE INDEX idx_assistance_submitted ON assistance_requests (submitted_at DESC);

CREATE TABLE partnership_requests (
  id           TEXT PRIMARY KEY,              -- pr-YYYY-MM-DD-HHmm-xxxx
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locale       TEXT NOT NULL,
  data         JSONB NOT NULL                 -- PartnershipRequestData
);
CREATE INDEX idx_partnership_submitted ON partnership_requests (submitted_at DESC);
```

**刻意保持简单**：
- 所有字段的合法值集合（applicant / assistance / referral / orgType / supportWay / interests / hasIdea）都在 `src/data/requests.ts` 以 `readonly string[] + as const + (typeof X)[number]` 模式定义，action 侧用 `enumValue` / `enumArray` 白名单过滤，admin 侧直接按 union 类型渲染 label 字典
- 问题文本（题干 / 选项文案）**不**进 DB，全走 `messages/{locale}.json` `forms.*` 命名空间
- 表单页 `generateMetadata` 设 `robots: { index: false, follow: true }`、成功页设 `{ index: false, follow: false }`；两张前台路径**不加入 `sitemap.ts`**，这两条是刻意决定
- Admin 页面（`/admin/requests` · `/admin/partnerships`）不走 i18n，英文硬编码，和 `/admin/news` 同一模式

**限流**：`src/lib/formRateLimit.ts` 每 IP 每 60 分钟 8 次提交。用 Upstash Redis `INCR` + 首次 `EXPIRE` 原子计数；Redis 不可用降级到进程内 Map（`STATE_CAP=2000` 做 LRU 兜底）。**IP 提取统一走 `src/lib/clientIp.ts` 的 `getClientIp()`**：`x-real-ip` 优先（Vercel 平台不可伪造），`x-forwarded-for` 仅非 Vercel 环境兜底 —— 避免攻击者塞伪造 XFF 头绕过限流。

**迁移工具**：`scripts/migrate-requests.mjs` 读本地 `.env` 里的 `DATABASE_URL`，把 JSON 导出批量回填进表（dev/prod 环境迁移或从旧 Google Form 批导时使用）。

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
│   │   ├── email/page.tsx       # Email 发送后台（Resend）
│   │   ├── amounts/page.tsx     # 各项目已筹金额手动维护
│   │   ├── requests/page.tsx    # Assistance 申请列表（只读）
│   │   └── partnerships/page.tsx # Partnership 申请列表（只读）
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
│       ├── public-agreements/   # 公共协议（捐赠公开要约）
│       ├── request-assistance/  # 申请帮助表单（+ /success 页）
│       └── partnership/         # 合作伙伴申请表单（+ /success 页）
├── components/
│   ├── about/                   # 关于页组件（VideoStory, TeamCollage, DocumentAccordion）
│   ├── common/                  # 通用 UI 组件（BottomSheet, DocumentViewer, Lightbox）
│   ├── home/                    # 首页组件（HeroSection, ProjectsSection, AboutSection, ValuesAccordion, AchievementsCarousel, NewsSection）
│   ├── layout/                  # 布局组件（Navigation, Footer, LoadingBar, CopyIbanButton）
│   ├── partners/                # 合作伙伴组件（PartnersStrip）
│   ├── projects/                # 项目组件（ProjectCard, ProjectStrip, ProjectGallery, DonationSidebar, MobileDonationSheet, PatientStories, RecoveryJourney）
│   ├── news/                    # 新闻组件（NewsCard, HomeDispatchCard, HomeDispatchCtaCard）
│   ├── admin/                   # Admin 后台组件（news 编辑器、EmailPanel、AmountsPanel、AssistanceRequestsPanel、PartnershipRequestsPanel；common/AlertBanner 共用错误/成功提示条）
│   ├── forms/                   # 表单原子（fields.tsx / PartnershipForm / RequestAssistanceForm）
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
│   ├── news.ts                  # 新闻类型定义
│   └── requests.ts              # Assistance/Partnership 表单字段类型 + 枚举白名单
├── i18n/
│   ├── config.ts                # 语言配置（locales, defaultLocale）
│   ├── request.ts               # next-intl 请求配置
│   └── routing.ts               # next-intl 路由配置
├── app/actions/
│   ├── news.ts                  # News admin（cookie session + SQL CRUD + Blob 图清理）
│   ├── email.ts                 # Email admin（cookie session + 模板渲染 + Resend 发送 + 历史拉取）
│   ├── projectAmounts.ts        # 项目已筹金额批量 UPSERT（admin only）
│   └── requests.ts              # Request/Partnership 提交（公开）+ admin 读取（需 cookie）
├── lib/
│   ├── utils.ts                 # cn() 工具函数
│   ├── resend.ts                # Resend 客户端单例（server-only），re-export emailFrom 的工具
│   ├── emailFrom.ts             # 发件人常量：display name / 域名 / 前缀白名单 / buildFromAddress（client-safe）
│   ├── email.ts                 # 邮箱地址正则（EMAIL_RE 单地址 / EMAIL_RE_BATCH 批量场景）
│   ├── emailTemplates.ts        # 邮件模板注册表（server-only，纯静态 HTML，无变量）
│   ├── emailTemplates/          # 每个模板单独一个 .ts，导出 subject / html / text 三常量
│   ├── news.ts                  # 新闻读取（从 Neon SELECT，带 unstable_cache，导出 NewsRow / rowToItem）
│   ├── projectAmounts.ts        # 项目已筹金额读取（Neon SELECT，unstable_cache 60s）
│   ├── db.ts                    # Neon Postgres 单例（`@neondatabase/serverless`）
│   ├── redis.ts                 # Upstash Redis 单例 + KV_ENABLED 探测（adminRateLimit / formRateLimit 共用）
│   ├── fetchWithTimeout.ts      # AbortSignal.timeout 封装（resend-inbound webhook 拉附件用）
│   ├── seo.ts                   # SEO helper：canonical / hreflang / openGraph / twitter
│   ├── clientIp.ts              # `x-real-ip` 优先、XFF 兜底的客户端 IP 提取（限流 / 审计共用）
│   ├── ids.ts                   # randomSuffix() 4 位 base36 后缀（news / requests id 共用）
│   ├── errors.ts                # errorMessage(err, fallback) 把异常压成 server action result
│   ├── adminAuth.ts             # 管理员密码 hash 校验（server-only）
│   ├── adminSession.ts          # HMAC-SHA256 签名 cookie 会话；requireAdmin (API route) / ensureAdmin (server action)
│   ├── adminRateLimit.ts        # 管理员登录 IP 速率限制（@upstash/redis，fallback 进程内 Map）
│   ├── formRateLimit.ts         # 前台表单 IP 速率限制（每 IP 每小时 8 次）
│   └── requests.ts              # Assistance/Partnership 表 INSERT / SELECT（Neon Postgres）
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
- 任何 `<iframe src>` 加 `sandbox` 属性（最少 `allow-same-origin`）。**PDF 预览不要用 iframe** —— Chrome 内置 PDF Viewer 在 sandboxed iframe 里会被拒绝加载（呈现"此页面已被 Chrome 屏蔽"），改用 `<object data={url} type="application/pdf">` + 内嵌下载链接 fallback（见 `DocumentViewer.tsx`）
- Admin server action / API route 不接受 `pw` 参数，一律 `await requireAdmin()` 从 cookie 取身份

### Button / a11y

- 所有 `<button>` 必须有 `type="button"`（除非确实要 submit），否则在 `<form>` 内会误触发提交
- 弹层组件（drawer / lightbox / modal）用 `<FocusTrap>`（focus-trap-react）包裹，打开时锁键盘焦点
- `<input>` 必须配 `<label htmlFor>` 或 `aria-label`

---

## 注意事项 (Gotchas)

- **Tailwind v4**: 使用 CSS-first 配置（`@import "tailwindcss"`），不再有 `tailwind.config.js`。自定义主题通过 `globals.css` 中的 `@theme` 定义
- **Next.js 16 异步 API**: `cookies()`、`headers()`、`params`、`searchParams` 都需要 `await`
- **路由中间件**: 文件位于 `src/proxy.ts`（Next.js 16 起用 `proxy.ts` 替代 `middleware.ts`，使用旧名会触发弃用警告），仅用于 next-intl 路由
- **默认语言**: `ua`（乌克兰语）是默认语言，不是 `en`
- **翻译键同步**: 添加新 UI 文案时，`ua.json` 和 `en.json` 必须同时更新
- **SEO metadata**: 新页 `generateMetadata` 走 `src/lib/seo.ts` 的 `buildAlternates` / `buildOpenGraph` / `buildTwitter` helper，不要手写 canonical / hreflang / OG；新路径记得加到 `src/app/sitemap.ts`
- **KV 连接**：生产用 Vercel Marketplace KV（Upstash），SDK 是 `@upstash/redis`（**不要**装 `@vercel/kv`，已 deprecated）。`Redis.fromEnv()` 自动读 `KV_REST_API_URL` / `KV_REST_API_TOKEN`
- **OG 图**: `public/og-image.jpg`（1200×630，≤ 200KB），由 `lib/seo.ts` 默认引用。替换时保持尺寸与路径
- **客户端 IP 提取**：限流 / 审计类场景读 IP 统一 `import { getClientIp } from '@/lib/clientIp'`，禁止在 server action / API route 里现写 `headers().get('x-forwarded-for')`。`x-real-ip` 优先（Vercel 不可伪造），XFF 仅非 Vercel 环境兜底 —— 客户端可伪造 XFF 旋转 key 绕开计数。

---

## 交流语言

- 始终使用中文与用户交流
- 代码注释使用中文
- Git commit message 使用中文
