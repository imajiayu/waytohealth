# Way to Health 代码重构计划 — v2

> 基于 2026-05-02 v1（R1-R7）合并后的新基线，再次全量扫描得出的第二轮可执行项。
> 红线与 v1 完全一致：**零 UI 视觉/DOM 层级变化 + 零业务行为变化 + 零依赖新增**。

---

## v1 完成情况（基线参考，不重做）

| 项 | 内容 | 净效应 |
|----|------|--------|
| R1 | `getClientIp()` → `lib/clientIp.ts` | 2 处复制 → 1 处 |
| R2 | `KV_ENABLED` + Redis 单例 → `lib/redis.ts` | 2 处复制 → 1 处 |
| R3 | `ensureAdmin()` → `lib/adminSession.ts` | 11 处 8 行模板 → 2 行 |
| R4 | `randomSuffix()` → `lib/ids.ts` | 2 处复制 → 1 处 |
| R5 | `EMAIL_RE` / `EMAIL_RE_BATCH` → `lib/email.ts` | 3 处分散 → 1 处 |
| R6 | Tag 常量统一到 `data/news.ts` | server + client 单一来源 |
| R7 | NewsEditor 局部拆分 | **放弃**（与 React state 内聚冲突） |

---

## v2 红线（贯穿所有 v2 任务）

继承 v1 全部红线，并补充：
1. **抽出共享 UI 组件时，渲染输出的 className 与 DOM 层级必须与原代码视觉等价**（class 字符串顺序可不同，但 utility 集合必须一致；DOM 不能多包一层 div）
2. **不动 client fetch 的 AbortController 现状** —— 现有 `cancelled` flag 已避免 unmount 后 setState；引入 abort signal 是行为变更
3. **不抽 useFetchData hook** —— 5 个 admin panel 的 cancelled flag 模式虽重复，但每处 setter 各异，抽 hook 会引入 generic 类型负担
4. **不动错误返回类型 union** —— 9 处签名虽相似，但 payload 结构差异大；统一成 `ActionResult<T>` 会模糊每个 action 的返回合约

---

## v2 进度看板

| # | 项目 | 价值 | 风险 | 状态 |
|---|------|------|------|------|
| R8 | 抽 `errorMessage(err, fallback?)` helper | 高 | 极低 | ✅ 完成（server actions 12 处替换） |
| R9 | 删除 `actions/news.ts` 内 `NewsRow` + `rowToItem` 重复定义 | 高 | 极低 | ✅ 完成（lib/news.ts 改 export，单一来源） |
| R10 | 抽 `<AlertBanner>` 共享组件（6 处错误条 + 1 处成功条） | 中 | 低 | ✅ 完成（实际 8 处错误条 + 1 处成功条） |
| — | useFetchData hook | — | — | ❌ 不做（见下） |
| — | AbortController for client fetch | — | — | ❌ 不做（见下） |
| — | ActionResult<T> 统一类型 | — | — | ❌ 不做（见下） |
| — | 按钮样式 className 抽常量 | — | — | ❌ 不做（见下） |

**验证结果**：`npm run lint` ✅ 零警告 / `npm run build` ✅ 构建成功 / 15 个静态页正常生成

**v1 + v2 累计净效应**：18 改 + 5 个新 helper + 1 个新组件夹 = **净减 95 行重复代码**（v1 -65 行 + v2 -30 行）

---

## R8 — 抽 `errorMessage(err, fallback?)` helper

**事实**：`err instanceof Error ? err.message : '...'` 模式在代码中出现 **18 处**：

server actions（15 处）：
- `actions/news.ts`: 行 95（`'invalid date'`）、117、189（`String(err)`）、198（`String(err)`）、200、232（`String(err)`）、239、257（`'cleanup failed'`）、275 — 共 9 处
- `actions/email.ts`: 行 109（`'resend misconfigured'`）、135、186（`'resend misconfigured'`）、223 — 共 4 处
- `actions/requests.ts`: 行 208、220 — 共 2 处

client component（3 处，**不在本项范围**）：
- `components/admin/news/NewsEditor.tsx`: 行 125（`'transcode failed'`）、193（`'unknown'`）、253（`'Submit failed.'`）

其中 **12 处** 的 fallback 是 `'unknown error'`（一字不差），3 处 `String(err)`，3 处定制 fallback（`'invalid date'` / `'cleanup failed'` / `'resend misconfigured'`）。

**做法**：
1. 在 `src/lib/errors.ts`（新建）导出：
   ```ts
   export function errorMessage(err: unknown, fallback = 'unknown error'): string {
     return err instanceof Error ? err.message : fallback;
   }
   ```
2. server actions 共 15 处替换为 `errorMessage(err)` 或 `errorMessage(err, 'invalid date')` 等
3. **`String(err)` 的 3 处保留原写法** —— 它们出现在 `console.error` 的 detail 对象里，语义是"非 Error 也强制转字符串"，与 `errorMessage` 的"用 fallback"不等价
4. **client 端 3 处保留原写法** —— `NewsEditor.tsx` 里 fallback 字符串是 user-facing UI 文本（"Submit failed." 直接显示给管理员），不是错误返回值；走 helper 反而模糊"这是给用户看的字符串"的语义

**关键约束**：
- `errors.ts` **不**加 `import 'server-only'` —— 让未来 client 端也能复用（虽本轮不动 client）
- helper 不做 stack trace、不打 log、不上报 —— 只做"取 message 或返回 fallback"，最小职责

**验收**：
- `grep -rn "instanceof Error ? " src/app/actions/` 应只剩 3 处 `String(err)`
- 15 处替换后行为等价（手动核对每处 fallback 字符串保留）
- `npm run lint && npm run build` 通过

**不变更**：所有错误字符串本身（`'unknown error'` / `'invalid date'` / 等）不动；返回结构 `{ ok: false, error }` 不动

- [x] 完成

---

## R9 — 删除 `actions/news.ts` 内 `NewsRow` + `rowToItem` 重复定义

**事实**：以下两处**逐字符相同**（含注释、含字段顺序、含可选展开模式）：

`src/lib/news.ts:7-25`：
```ts
interface NewsRow {
  id: string;
  published_at: Date;
  title: { ua: string; en: string };
  body: { ua: string; en: string };
  images: string[];
  tags: Tag[];
}

function rowToItem(r: NewsRow): NewsItem {
  return {
    id: r.id,
    published_at: r.published_at.toISOString(),
    title: r.title,
    body: r.body,
    ...(r.images && r.images.length > 0 ? { images: r.images } : {}),
    ...(r.tags && r.tags.length > 0 ? { tags: r.tags } : {}),
  };
}
```

`src/app/actions/news.ts:53-71`：完全一致。

**做法**：
1. 在 `src/lib/news.ts` 把 `NewsRow` interface 与 `rowToItem` 函数都改为 `export`
2. `src/app/actions/news.ts` 删除本地两个声明，改 `import { type NewsRow, rowToItem } from '@/lib/news'`
3. 不动 `lib/news.ts` 现有的 `getAllNews` / `getNews` 公开 API

**关键约束**：
- `lib/news.ts` 已是 `'server-only'`，`actions/news.ts` 也是 `'use server'`，链路上都是 server-only，import 安全
- `lib/news.ts` 现在只用 `Tag`，加上 `NewsItem` 已经从 `@/data/news` import 了，不需要再加 import

**验收**：
- `grep -n "interface NewsRow\\|function rowToItem" src/` 应只剩 `lib/news.ts` 各 1 处
- `npm run build` 通过

**不变更**：DB row 解析逻辑、空数组不序列化的行为、列表查询 SQL

- [x] 完成

---

## R10 — 抽 `<AlertBanner>` 共享组件

**事实**：错误红条 className 在以下 6 处**核心 utility 一字不差**（仅前缀 margin 不同）：

| 文件:行 | 完整 className |
|---------|---------------|
| `EmailHistory.tsx:94` | `mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700` |
| `EmailPanel.tsx:126` | `rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700` |
| `EmailPanel.tsx:261` | `rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700` |
| `EmailPanel.tsx:313` | `rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700` |
| `NewsEditor.tsx:325` | `rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700` |
| `NewsList.tsx:51` | `mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700` |
| `AssistanceRequestsPanel.tsx:77` | `mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700` |
| `PartnershipRequestsPanel.tsx:91` | `mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700` |

绿色成功条 1 处可顺带覆盖：
| `NewsEditor.tsx:328` | `rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700` |

**EmailPanel.tsx:268-271 的动态绿/橙切换不在本项范围**（结构是 `${cond ? green : amber}`，与 AlertBanner 的固定 variant 模式不通用）。

**做法**：
1. 新建 `src/components/admin/common/AlertBanner.tsx`：
   ```tsx
   interface Props {
     variant: 'error' | 'success';
     className?: string; // 调用方传 mb-4 / mt-3 等位置 margin
     children: React.ReactNode;
   }
   const VARIANT_CLS: Record<Props['variant'], string> = {
     error: 'border-red-200 bg-red-50 text-red-700',
     success: 'border-green-200 bg-green-50 text-green-700',
   };
   export default function AlertBanner({ variant, className, children }: Props) {
     const cls = ['rounded-md border p-3 text-sm', VARIANT_CLS[variant], className]
       .filter(Boolean)
       .join(' ');
     return <div className={cls}>{children}</div>;
   }
   ```
2. 8 处错误条替换为 `<AlertBanner variant="error" className="mb-4">{...}</AlertBanner>`（按需带 className）
3. NewsEditor.tsx:328 替换为 `<AlertBanner variant="success">{success}</AlertBanner>`

**关键约束**：
- DOM 输出仍是单个 `<div>` —— **零 DOM 层级变化**
- Tailwind utility 集合完全相同 —— 视觉零变化（class 字符串顺序可能不同，但 Tailwind v4 utility 之间无冲突）
- 不传 ARIA `role="alert"` 等属性 —— 原代码就没有，本次不引入新行为
- **不导出 `AlertBannerProps` 类型** —— 减少表面积，调用方都在同 admin 域内

**验收**：
- `grep -rn "border-red-200" src/components/admin/` 应只剩 `AlertBanner.tsx` 一处
- 浏览器手测：admin 后台 4 个 panel 的错误态、NewsEditor 提交失败 / 成功提示视觉与行为均不变

**不变更**：错误/成功文案、显示/隐藏条件、margin 定位

- [x] 完成

---

## ❌ v2 明确不做的项

### useFetchData hook（统一 5 处 cancelled flag）

**事实**：`AdminShell.tsx:28-40` / `EmailHistory.tsx:43-60` / `NewsList.tsx:18-27` / `AssistanceRequestsPanel.tsx:47-58` / `PartnershipRequestsPanel.tsx:61-72` 都用同样的：
```ts
useEffect(() => {
  let cancelled = false;
  (async () => {
    const res = await someAction();
    if (cancelled) return;
    setSomething(res);
  })();
  return () => { cancelled = true; };
}, []);
```

**为什么不做**：5 处虽重复，但每处 setter 各异（`setAuthed` / `setItems` / `setEmails` / 等），抽 `useFetchData<T>(fn)` 返回 `{ data, loading, error }` 后，调用方仍需根据 union/null 状态决定渲染分支 —— 净代码减少有限，但引入 generic + 时序心智负担。这正是 React Query 解决的问题域，但项目刻意未引入它（无 caching 需求 / admin 流量极低）。

### AbortController for client fetch

**为什么不做**：`AdminShell` / `DocumentViewer` 已用 `cancelled` flag 避免 unmount 后 setState，行为已经正确。改成 abort signal 会在 unmount 时**真正中断**网络请求 —— 这是行为变更（之前请求继续完成、结果丢弃；之后请求被中断），违反"零业务行为变化"红线。

### `ActionResult<T>` 统一返回类型

**为什么不做**：9 处虽都是 `{ ok: true, ... } | { ok: false, error: string }`，但 `ok: true` 的 payload 各异（`{ id }` / `{ items }` / `{ sent, failed, failures, rendered }`）。统一成 `ActionResult<T>` 会让每个 action 的返回合约失去自描述性，且 union 拼写本就一目了然。

### 按钮样式 className 抽常量

**事实**：`rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50` 在 `NewsPanel.tsx:27` / `EmailPanel.tsx:293` / `NewsEditor.tsx:343` 出现 3 处。

**为什么不做**：3 处距 CLAUDE.md 的 "三段相似好过早抽象" 阈值刚到，且这是 admin 内部样式，不向外扩散。等真出现第 5 处再评估。

### 删除 LoadingBar.tsx:45 的 eslint-disable

**为什么不做**：注释已说明意图（pathname 变化即导航完成，intentional）；强行加依赖会触发死循环。保持原状。

### 重写 BottomSheet.tsx:91 的 set-state-in-effect

**为什么不做**：CLAUDE.md 说"matchMedia 用 useSyncExternalStore"已落实在该文件他处。L91 是 `expandTrigger` prop 的同步点，已 eslint-disable + 注释说明。改写需要把 prop 协议改成 ref/callback，是 API 变更。

---

## v2 完成准则

- 三项 Todo → ✅，或 ❌ 标注理由
- 每项独立 commit（中文 message），主语跟踪到具体文件
- v2 文档进度看板更新

---

## 完成后可考虑的三期（不在 v2 范围）

如果未来出现以下信号再拉进 v3：
- 出现第 5 个 admin panel 用 `cancelled` flag → 评估 useFetchData
- 出现第 5 个 button 用 blue-600 蓝按钮 → 评估抽 className 常量
- 引入 React Query / SWR → useFetchData 自然消失
- 错误处理变复杂（需要错误码 / 上报 / stack trace） → 升级 `errorMessage` helper

---

## 总评

v1 后代码已经相当干净。v2 的 3 项是"出现 ≥ 6 处一字不差"的尾部清理，做完后**核心重复都将消除**。再继续抽就会触及"为单点用法新建抽象"的反模式。
