# Way to Health 代码重构计划

> 本文档基于 2026-05-02 的全量代码扫描，覆盖 `src/` 下 122 个 ts/tsx 文件 / 13.5K 行。
> 每项重构均经过实际文件与行号核实，**不为单点用法引入抽象**。

---

## 红线（贯穿所有任务）

1. **零 UI / 样式变化** —— DOM 结构、className、视觉表现严格保持不变
2. **零业务行为变化** —— 路由、状态机、限流参数、数据库 schema、外部调用入参均不变
3. **零依赖新增** —— 不引入新 npm 包
4. **不动 i18n 文案** —— `messages/{ua,en}.json` 不增不减不改
5. **不碰邮件模板** —— `src/lib/emailTemplates/` 系列刻意保持静态 HTML 常量（CLAUDE.md 已明确）
6. **每项独立可回滚** —— 一项一个 commit，验收后再合下一项

验证手段：每项做完跑 `npm run lint && npm run build`，并人工确认 `git diff` 只动了预期文件。

---

## 进度看板

| # | 项目 | 价值 | 风险 | 状态 |
|---|------|------|------|------|
| R1 | 抽出 `getClientIp()` 共享 helper | 高 | 极低 | ✅ 完成 |
| R2 | 抽出 Redis 单例 + `KV_ENABLED` | 高 | 低 | ✅ 完成 |
| R3 | 抽出 `ensureAdmin()` guard | 中 | 低 | ✅ 完成（11 处 / 比原计划 7 处多收 email.ts 4 处） |
| R4 | 抽出 `randomSuffix()` 工具 | 中 | 极低 | ✅ 完成 |
| R5 | 统一 `EMAIL_RE` 邮箱正则 | 中 | 极低 | ✅ 完成 |
| R6 | TagInput 复用 server 常量 | 低 | 低 | ✅ 完成 |
| R7 | NewsEditor `handleSubmit` 局部拆分 | 低 | 中 | ❌ 放弃 — 抽出会破坏 React state 内聚（见 R7 段） |
| — | `resend-inbound/route.ts` 大文件 | — | — | ❌ 不做（见下） |
| — | `partnershipInvite{Ua,En}.ts` 抽公共骨架 | — | — | ❌ 不做（见下） |
| — | 全局 `process.env` config 中心化 | — | — | ❌ 不做（见下） |

**验证结果**：`npm run lint` ✅ 零警告 / `npm run build` ✅ 构建成功 / 15 个静态页生成正常

---

## R1 — 抽出 `getClientIp()` 共享 helper

**事实**：`src/lib/adminAuth.ts:13-22` 与 `src/app/actions/requests.ts:67-76` 两处函数体**逐字符相同**（含注释），用于客户端 IP 提取。

**做法**：
1. 新建 `src/lib/clientIp.ts`，导出 `getClientIp()`，移植原注释（解释 `x-real-ip` 优先 `x-forwarded-for` 兜底的原因，CLAUDE.md 在"客户端 IP 提取"段落里有相关安全说明）
2. `adminAuth.ts` / `requests.ts` 删除本地实现，改 `import { getClientIp } from '@/lib/clientIp'`
3. 文件头加 `import 'server-only'`

**验收**：
- `git diff` 只动这 3 个文件
- `grep -rn "getClientIp" src/` 应只剩定义 1 处 + 调用 2 处
- `npm run build` 通过

**不变更**：函数签名、返回值、调用点的语义

- [x] 完成

---

## R2 — 抽出 Redis 单例 + `KV_ENABLED`

**事实**：`src/lib/adminRateLimit.ts:21-27` 与 `src/lib/formRateLimit.ts:16-21` 两处**逐字符相同**：

```ts
const KV_ENABLED = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}
```

**做法**：
1. 新建 `src/lib/redis.ts`，导出 `KV_ENABLED` 常量与 `getRedis()` 函数；保留惰性单例语义（首次调用时才 `Redis.fromEnv()`）
2. 两个 rate limiter 改 import；删除本地实现
3. 文件头加 `import 'server-only'`

**关键约束**：
- 必须保持**单例模块级**（不要每个 limiter 各持一个 `_redis`，否则首调用时会创建两个连接配置实例 —— 行为虽不会出错但与现状不一致）
- 不要把 `KV_ENABLED` 改成 getter / 函数，CLAUDE.md 说"Redis.fromEnv() 自动读 KV_REST_API_URL/TOKEN"是预期行为

**验收**：
- 两个 limiter 文件 `KV_ENABLED ? bumpKv(k) : bumpMem(k)` 等三元判断逻辑保持不变
- `grep -rn "KV_REST_API_URL" src/` 应只剩 `lib/redis.ts` 一处

**不变更**：限流窗口、阈值、锁定时长、KV 失败降级路径

- [x] 完成

---

## R3 — 抽出 `ensureAdmin()` guard

**事实**：以下 7 处出现**完全相同**的 5 行模板：

```ts
try {
  await requireAdmin();
} catch {
  return { ok: false, error: 'unauthorized' };
}
```

- `src/app/actions/news.ts:84-88, 142-146, 219-223, 262-266, 282-286`（5 处）
- `src/app/actions/requests.ts:216-219, 230-234`（2 处）

**做法**：在 `src/lib/adminSession.ts` 已有 `requireAdmin` 旁追加一个轻量 wrapper：

```ts
export async function ensureAdmin(): Promise<{ ok: false; error: 'unauthorized' } | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return { ok: false, error: 'unauthorized' };
  }
}
```

调用点改为：

```ts
const guard = await ensureAdmin();
if (guard) return guard;
```

**关键约束**：
- 仅做"未登录返回 401 形 result"的 action 才能用这个 helper
- API route handlers（如 `/api/news/upload`）仍直接 `await requireAdmin()` —— 它们的失败语义是抛 401 Response，不是 result object，不通用
- TS 上 `null` 缩窄会让 `guard` 后续不可用，类型友好

**验收**：
- 11 个调用点行为完全等价（5 news + 4 email + 2 requests）
- 调用方返回类型 union 不变（手动核对每个 action 的 return type）

**不变更**：错误字符串 `'unauthorized'`、返回结构 `{ ok: false, error }`、cookie 验证逻辑

- [x] 完成 — 实际收编 11 处（计划文档原列 7 处时漏扫了 `email.ts` 的 4 处 `listTemplatesAction` / `previewEmailAction` / `listEmailHistoryAction` / `sendEmailAction`，行为模板与 news/requests 完全一致，本轮一并替换）

---

## R4 — 抽出 `randomSuffix()` 工具

**事实**：`src/app/actions/news.ts:37-39` 与 `src/lib/requests.ts:32-34` **逐字符相同**：

```ts
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}
```

**做法**：放进 `src/lib/ids.ts`（新文件），同时把两个 `makeXxxId` 留在原处不动 —— 它们的前缀语义不同（news 的 id 不带前缀、`ar-`、`pr-` 各自一处），合并反而失去可读性。

**关键约束**：本项**仅**抽出 `randomSuffix`，不动 `makeNewsId` / `makeRequestId`（避免越界）。

**验收**：
- `grep -rn "randomSuffix" src/` 应只剩定义 1 处 + 调用 2 处

- [x] 完成

---

## R5 — 统一 `EMAIL_RE` 邮箱正则

**事实**：3 处定义，2 处一致 + 1 处变体：

| 位置 | 正则 |
|------|------|
| `src/app/actions/requests.ts:38` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `src/app/api/webhooks/resend-inbound/route.ts:12` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`（同上） |
| `src/app/actions/email.ts:18` | `/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/`（额外排除 `,;`） |

**做法**：在新建的 `src/lib/email.ts`（**或并入** R1 的 `clientIp.ts`，不建议 —— 职责完全无关）导出两个常量：

```ts
// 单地址校验：用于表单字段、入站邮件 reply-to
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 批量发送场景：额外禁止 ,; 防止用户在单地址输入框误拼多个
export const EMAIL_RE_BATCH = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
```

3 个调用点改 import；保留原注释。

**关键约束**：**两个变体保持独立**，不要尝试合并 —— 它们应对的输入场景不同（`email.ts` 的 `parseRecipients` 已经按换行拆分，再禁掉 `,;` 是对用户误输入的额外防御）。

**验收**：
- `grep -nE "\\^\\[\\^\\\\s@" src/` 应只剩 `lib/email.ts` 一处定义

**不变更**：正则本身的字符集（不动 = 不改业务）

- [x] 完成

---

## R6 — TagInput 复用 server 常量

**事实**：`src/components/admin/news/TagInput.tsx` 与 `src/app/actions/news.ts` 各自定义了 `MAX_TAGS_PER_POST = 6` / `MAX_TAG_LENGTH = 30`（CLAUDE.md 已点名 "前端 TagInput 也做一次相同逻辑；这里是服务端兜底"）。

**做法**：把这两个常量从 `news.ts` 移到 `src/data/news.ts`（已有 `Tag` 类型）。`news.ts` 与 `TagInput.tsx` 都从 `@/data/news` import。

**关键约束**：
- `src/data/news.ts` 必须保持 client-safe（不能加 `import 'server-only'`）—— 它已经被前端组件使用
- **绝对不要**让 client 直接 import `app/actions/news.ts` —— 会拖入 server-only 链路

**验收**：
- `grep -n "MAX_TAGS_PER_POST\\|MAX_TAG_LENGTH" src/` 应只剩 `data/news.ts` 定义 + 2 处 import
- 两端校验数值仍各自独立执行（前端兜底 + 后端权威保持原意）

- [x] 完成

---

## R7 — `NewsEditor.tsx` 局部拆分

**现状**：`src/components/admin/news/NewsEditor.tsx` 394 行，其中 `handleSubmit` 约 113 行嵌套了：图片上传 → 失败回滚 → INSERT/UPDATE 分支 → 重定向。

**做法（保守）**：**不**新建文件、**不**拆子组件 —— 仅在文件内部把 `handleSubmit` 中的纯函数片段提取为模块级 `function` 或同文件内 `async function`：

候选可抽点（仅在抽出后`handleSubmit`明显变短时才做）：
- 图片转码 / 上传 promise chain
- 上传失败时的 blob 回滚

**关键约束**：
- **本项可选**，如改完代码不更易读则放弃
- 不动 `useEffect` 数量与依赖、不动 ref 用法、不动 form ref 提交时序
- 不向外导出新模块

**验收**：手动 diff 阅读后认为 `handleSubmit` 主体逻辑更线性 —— 否则回退

**判断准则**：完成后，`handleSubmit` 函数体应能在一屏内看完主流程；如做不到，说明拆得不对，回滚。

- [x] **放弃** — 仔细评估后判断不做：
  - `handleSubmit` 流程已是线性的（验证 → 上传 → 调 action → 重定向 → cleanup），每段有明确注释
  - 状态 setter（`setError` / `setBusy` / `setUploadProgress` / `setSuccess` / `doneTimeoutRef`）紧绑 React state，抽出来要么需要把 4-5 个 setter 作为参数传入（破坏内聚），要么需要 context hook（过度抽象）
  - edit / create 两个分支虽然结构相似，但 `PublishInput` / `UpdateInput` 是 server action 边界类型，合并会抹掉这层，违反"零业务行为变化"红线
  - 符合本计划"做完不更易读则放弃"约定

---

## ❌ 明确不做的项（避免后续被误改动）

### `src/app/api/webhooks/resend-inbound/route.ts`（386 行）
**为什么不拆**：所有 helper（`escapeHtml` / `joinAddresses` / `sanitizeHeader` / `downloadAttachment` / 循环检测三件套）**只被这一个 route 用**。CLAUDE.md：「不要为单点用法新建抽象」。文件长但每段职责清晰、注释充分。

### `src/lib/emailTemplates/partnershipInvite{Ua,En}.ts`
**为什么不合并**：CLAUDE.md 显式要求"邮件模板保持静态 HTML 常量、零变量、零渲染逻辑"——这是为了"避免被当开放邮件发射器用 / 完整保留设计师交付的 HTML"。两份高度相似不是问题，是设计权衡。

### 全局 `process.env` config 中心化
**为什么不做**：每个 env var 的消费点目前都在它最相关的模块（`adminSession.ts` 读 `ADMIN_*`、`seo.ts` 读 `NEXT_PUBLIC_SITE_URL`、`emailFrom.ts` 不读 env）。强行汇聚到 `lib/config.ts` 会破坏「每个 lib 自带 fail-loud 校验」的现状（如 `adminAuth.ts:30-32` 缺 `SALT` 直接 throw）。

### `as` 类型断言"清理"
**为什么不做**：核查后所有 `as` 用法都在守卫之后（如 `enumValue` 内的 `as T` 已经过 `allowed.includes(v)` 检查）。强行替换成函数重载或类型守卫会让代码更绕。CLAUDE.md 禁的是 `as Locale` / `as 'ua' | 'en'` 这类绕过类型系统的硬转，而代码里这类已经被 `toLocale()` / `isLocale()` 守卫消除。

### `src/components/admin/news/NewsEditor.tsx` 拆子组件
**为什么不做（默认）**：见 R7 —— 只做局部内联拆分，不抽 `ImageUploadManager` / `NewsFormFields` 等新文件。表单字段/上传逻辑/预览三者通过 React state 紧耦合（imageItems、formRef、submitting），拆出去会拖一堆 props 穿透。

### 其他大文件（`PartnershipForm.tsx` 306 / `PatientStories.tsx` 296 / `AchievementsCarousel.tsx` 309 / `EmailPanel.tsx` 340 / `public-agreements/page.tsx` 391 等）
**为什么不拆**：扫描确认这些是 JSX 模板密集（每行认知成本低）或交互内聚（拖拽 / 滚动状态机不能割开），拆分增加心智成本而不降低。

---

## 完成准则

- 全部 ⬜ → ✅，或 ❌ 标注理由
- 每项独立 commit，commit message 中文，主语跟踪到具体文件
- 最终 PR 描述里贴本文档的"进度看板"

---

## 完成后可考虑的二期（不在本计划范围）

如果未来在以下场景**新增第 3 处**重复，再拉进重构计划：
- 新增需要 IP 提取的 server action → 已有 `getClientIp` helper，自然复用
- 新增第三种 rate limiter → 评估是否抽 `bumpCounter(kind, ip, window, max)` 通用接口
- 新增第三个邮件正则用法 → 评估是否引入 `validateEmail()` 函数
