# 捐赠项目 + 商品购买系统设计

> Way to Health 统一支付系统 — 捐赠与商品共用一套状态机，Stripe 驱动

---

## 1. 核心设计原则

| 原则 | 说明 |
|------|------|
| **一套表、一套状态机** | `orders` 表用 `type` 字段区分捐赠/商品，共用状态流转 |
| **状态最少化** | 5 个状态，不暴露支付网关内部细节 |
| **Stripe 全托管支付** | Checkout Session 处理一次性支付，Subscriptions 处理月捐 |
| **不做库存管理** | 商品通过上架/下架控制，不做实时库存扣减 |

---

## 2. 数据模型

### 2.1 项目与商品 — 静态文件管理（不入库）

项目和商品的展示信息全部用静态文件管理，不存数据库。通过 `id` 关联到文件目录：

```
public/
├── data/
│   ├── projects/
│   │   ├── 1/
│   │   │   ├── data.json        # 项目元数据
│   │   │   ├── cover.jpg        # 封面图
│   │   │   └── gallery/         # 更多图片
│   │   │       ├── 1.jpg
│   │   │       └── 2.jpg
│   │   ├── 2/
│   │   │   ├── data.json
│   │   │   └── cover.jpg
│   │   └── index.json           # 项目列表（id + 排序 + 是否活跃）
│   └── products/
│       ├── 1/
│       │   ├── data.json
│       │   ├── cover.jpg
│       │   └── gallery/
│       ├── 2/
│       │   ├── data.json
│       │   └── cover.jpg
│       └── index.json           # 商品列表（id + 价格 + 是否上架）
```

**项目 `data.json` 示例** (`public/data/projects/1/data.json`)：
```jsonc
{
  "title": { "ua": "Фізична реабілітація", "en": "Physical Rehabilitation" },
  "description": { "ua": "...", "en": "..." },
  "goal_amount": 5000,      // 目标金额，null 表示无上限
  "currency": "USD",
  "tags": ["rehabilitation", "children"]
}
```

**商品 `data.json` 示例** (`public/data/products/1/data.json`)：
```jsonc
{
  "title": { "ua": "Благодійна футболка", "en": "Charity T-Shirt" },
  "description": { "ua": "...", "en": "..." },
  "price": 25,
  "currency": "USD",
  "variants": ["S", "M", "L", "XL"]
}
```

**ID 注册表**（TypeScript 常量，编译时类型检查）：

```typescript
// src/data/projects.ts
export const PROJECTS = [1, 2, 3] as const
export type ProjectId = (typeof PROJECTS)[number]  // 1 | 2 | 3

// src/data/products.ts
export const PRODUCTS = [1, 2, 3] as const
export type ProductId = (typeof PRODUCTS)[number]  // 1 | 2 | 3
```

> **数据库不存项目和商品表。** 添加/编辑项目或商品 = 修改静态文件 + 常量 + 部署。
> 不需要的项目/商品直接从常量数组移除即可。
> 数据库只存 `orders` 表（交易数据），通过 `project_id` / `product_id` 关联到静态文件的 id。
> TypeScript 类型系统确保代码中不会引用无效的 id。
```

商品状态（3 种，仅管理用途）：
- `draft` — 草稿，前端不可见
- `on_sale` — 上架，可购买
- `off_sale` — 下架，不可购买

### 2.3 `orders` — 统一订单表（核心）

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_ref TEXT UNIQUE NOT NULL,         -- 格式: DON-xxx 或 PUR-xxx

  -- 类型区分
  type TEXT NOT NULL CHECK (type IN ('donation', 'purchase')),

  -- 关联（二选一，对应静态文件中的 id）
  project_id INT,                              -- type=donation 时
  product_id INT,                              -- type=purchase 时

  -- 支付信息
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_checkout_session_id TEXT,        -- Stripe Checkout Session ID
  stripe_payment_intent_id TEXT,          -- Stripe PaymentIntent ID
  stripe_subscription_id TEXT,            -- 月捐订阅 ID（仅 subscription 订单）

  -- 买家/捐赠者信息
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_message TEXT,                  -- 捐赠留言（donation 专用）
  locale TEXT NOT NULL DEFAULT 'ua' CHECK (locale IN ('ua', 'en')),

  -- 收货地址（purchase 专用，donation 为 null）
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,

  -- 物流追踪（purchase 专用）
  tracking_number TEXT,
  tracking_carrier Text,

  -- 商品数量（purchase 专用，donation 为 null）
  quantity INT DEFAULT 1,

  -- 订阅标记
  is_recurring BOOLEAN NOT NULL DEFAULT false,  -- 是否为月捐

  -- 状态
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'completed', 'cancelled', 'refunded')),

  created_at TIMESTAMPTZ DEFAULT now(),

  -- 约束：类型与关联字段一致
  CONSTRAINT type_ref CHECK (
    (type = 'donation' AND project_id IS NOT NULL AND product_id IS NULL)
    OR (type = 'purchase' AND product_id IS NOT NULL AND project_id IS NULL)
  ),
  -- 约束：purchase 必须有收货地址
  CONSTRAINT purchase_shipping CHECK (
    type = 'donation'
    OR (shipping_name IS NOT NULL AND shipping_address IS NOT NULL
        AND shipping_city IS NOT NULL AND shipping_country IS NOT NULL)
  )
);
```

### 2.4 `order_status_history` — 状态变更日志

```sql
CREATE TABLE order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,             -- 'stripe_webhook' | 'admin' | 'system'
  changed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. 状态机

### 3.1 全部状态（5 个）

```
pending → paid → completed
           ↓
         refunded

pending → cancelled
```

| 状态 | 含义 | 谁触发 |
|------|------|--------|
| `pending` | 已创建订单，等待支付 | 系统（创建时） |
| `paid` | Stripe 确认收款 | Stripe webhook |
| `completed` | 已完成（捐赠已执行 / 商品已送达） | 管理员 |
| `cancelled` | 未支付，已取消或过期 | Stripe webhook / 系统定时清理 |
| `refunded` | 已退款 | Stripe webhook |

### 3.2 状态转换规则

```typescript
// 完整的合法转换
const STATUS_TRANSITIONS = {
  pending:   ['paid', 'cancelled'],    // webhook 或过期
  paid:      ['completed', 'refunded'], // 管理员推进 或 退款
  completed: ['refunded'],              // 完成后仍可退款
  cancelled: [],                        // 终态
  refunded:  [],                        // 终态
}

// 管理员允许的转换（子集）
const ADMIN_TRANSITIONS = {
  pending:   [],
  paid:      ['completed'],
  completed: [],
  cancelled: [],
  refunded:  [],
}
```

### 3.3 状态分组（前端显示用）

```typescript
type StatusGroup = 'processing' | 'success' | 'terminal'

const STATUS_GROUPS = {
  pending:   'processing',
  paid:      'success',
  completed: 'success',
  cancelled: 'terminal',
  refunded:  'terminal',
}
```

### 3.4 与 waytofutureua 的对比

| waytofutureua 捐赠 (14) | waytofutureua 商品 (7) | **本系统 (5)** |
|---|---|---|
| pending | pending | **pending** |
| widget_load_failed | widget_load_failed | _(不需要，Stripe Checkout 无此问题)_ |
| processing | — | _(Stripe 内部处理)_ |
| fraud_check | — | _(Stripe 内部处理)_ |
| paid | paid | **paid** |
| confirmed | — | _(合并到 paid)_ |
| delivering | shipped | _(合并到 completed)_ |
| completed | completed | **completed** |
| expired | expired | **cancelled**（合并） |
| declined | declined | **cancelled**（合并） |
| failed | — | **cancelled**（合并） |
| refunding | — | _(Stripe 同步退款)_ |
| refund_processing | — | _(Stripe 同步退款)_ |
| refunded | — | **refunded** |

**14 + 7 = 21 个状态 → 5 个。**

---

## 4. Stripe 集成

### 4.1 一次性支付（Checkout Session）

```
用户点击捐赠/购买
    ↓
创建 order (status: pending)
    ↓
创建 Stripe Checkout Session
  - mode: 'payment'
  - success_url: /[locale]/orders/success?ref={order_ref}
  - cancel_url: /[locale]/orders/cancelled?ref={order_ref}
  - metadata: { order_ref, type }
    ↓
重定向到 Stripe 托管支付页
    ↓
Webhook: checkout.session.completed
  → order status: pending → paid
    ↓
Webhook: checkout.session.expired
  → order status: pending → cancelled
```

### 4.2 月捐订阅（Stripe Subscriptions）

```
用户选择月捐金额
    ↓
创建 Stripe Checkout Session
  - mode: 'subscription'
  - metadata: { project_id, type: 'donation', is_recurring: true }
    ↓
Webhook: checkout.session.completed
  → 创建首笔 order (status: paid, is_recurring: true, stripe_subscription_id: sub_xxx)
    ↓
每月自动扣款：
Webhook: invoice.paid
  → 创建新的 order 记录 (status: paid, is_recurring: true)
  → 关联同一个 stripe_subscription_id
    ↓
用户取消订阅（通过 Stripe Customer Portal）：
Webhook: customer.subscription.deleted
  → 不创建新订单，仅记录日志
```

### 4.3 退款

```
管理员在 Stripe Dashboard 发起退款
    ↓
Webhook: charge.refunded
  → order status: paid/completed → refunded
```

**关键简化**：退款在 Stripe Dashboard 操作，不在我们的管理后台。省去退款申请、处理中等中间态。

### 4.4 Webhook 处理（统一入口）

```
POST /api/webhooks/stripe
  ├── checkout.session.completed  → pending → paid
  ├── checkout.session.expired    → pending → cancelled
  ├── invoice.paid                → 创建新的月捐 order
  ├── charge.refunded             → paid/completed → refunded
  └── customer.subscription.deleted → 记录日志
```

**一个 webhook endpoint 处理所有事件**，通过 `event.type` 分发。

---

## 5. 订阅管理

### 5.1 用户自助管理

使用 **Stripe Customer Portal**，用户可以：
- 查看订阅状态
- 更新信用卡信息
- 取消订阅

我们只需在前端提供一个"管理订阅"按钮，跳转到 Stripe 生成的 Portal URL。

### 5.2 不需要 `recurring_donations` 表

waytofutureua 计划了独立的 `recurring_donations` 表来管理订阅状态。
我们不需要 — Stripe Subscriptions 本身就是订阅的单一数据源：
- 订阅状态查 Stripe API
- 每次扣款通过 webhook 自动创建 order 记录
- `orders.stripe_subscription_id` 关联所有同一订阅的订单

---

## 6. 管理后台

### 6.1 统一订单列表

一个页面展示所有订单，支持筛选：
- **按类型**：全部 / 捐赠 / 商品
- **按状态**：全部 / pending / paid / completed / cancelled / refunded

### 6.2 管理员操作

管理员唯一能做的状态转换：**paid → completed**

- 对于 **donation**：意味着"捐赠资金已用于项目"，可附带证明文件
- 对于 **purchase**：意味着"商品已寄出并确认送达"，需填写快递单号

这一个操作替代了 waytofutureua 的 `confirmed → delivering → completed` 三步。

### 6.3 退款

管理员在 Stripe Dashboard 操作退款，不在我们的后台。
Webhook 自动同步退款状态。

---

## 7. 前端页面

### 7.1 捐赠流程

```
/[locale]/donate
  → 选择项目 → 输入金额 + 姓名 + 邮箱 + 留言
  → 选择一次性 / 月捐
  → 跳转 Stripe Checkout
  → 返回成功/取消页
```

### 7.2 商品购买流程

```
/[locale]/merch
  → 浏览商品 → 选择商品 + 数量
  → 填写收货地址 + 姓名 + 邮箱
  → 跳转 Stripe Checkout
  → 返回成功/取消页
```

### 7.3 公开展示

- 捐赠列表页：展示所有 `paid` / `completed` 的捐赠（邮箱脱敏）
- 项目进度：汇总该项目所有成功捐赠金额 vs 目标金额

---

## 8. 邮件通知

| 事件 | 收件人 | 内容 |
|------|--------|------|
| 支付成功 | 捐赠者/买家 | 感谢 + 订单详情 |
| 订单完成（商品已寄出） | 买家 | 快递单号 + 追踪链接 |
| 月捐自动扣款 | 捐赠者 | 本月扣款确认 |

使用 Resend 发送。

---

## 9. 技术栈汇总

| 组件 | 技术 |
|------|------|
| 数据库 | Supabase (PostgreSQL) |
| 支付 | Stripe Checkout + Subscriptions |
| 状态管理 | 5 状态单一状态机 |
| Webhook | 单一 `/api/webhooks/stripe` 入口 |
| 退款 | Stripe Dashboard（不自建） |
| 订阅管理 | Stripe Customer Portal |
| 邮件 | Resend |
| 文件存储 | Supabase Storage（完成证明等） |

---

## 10. 与 waytofutureua 的复杂度对比

| 维度 | waytofutureua | **本系统** |
|------|--------------|-----------|
| 订单表 | 2 个（donations + market_orders） | **1 个**（orders） |
| 状态数 | 14 + 7 = 21 | **5** |
| Webhook 入口 | 3 个（wayforpay + nowpayments + wayforpay-market） | **1 个** |
| 状态转换守卫 | 2 套触发器 | **1 套** |
| 管理员操作 | 多步推进（confirmed → delivering → completed） | **1 步**（paid → completed） |
| 退款流程 | 3 个中间态 | **0 个**（Stripe 处理） |
| 订阅管理 | 自建表 + API | **Stripe 托管** |
| 库存管理 | 原子扣减 + cron 恢复 | **无**（手动上下架） |
| 支付渠道 | 2 个（WayForPay + NOWPayments） | **1 个**（Stripe） |
