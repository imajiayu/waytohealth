# 执行计划：捐赠项目 + 商品购买系统

> 基于 [PAYMENT_SYSTEM_DESIGN.md](./PAYMENT_SYSTEM_DESIGN.md)，分阶段实施
>
> 进度标记：⬜ 未开始 | 🔲 进行中 | ✅ 完成 | ⏭️ 跳过

---

## 阶段 0：基础设施准备

> 目标：Supabase + Stripe 账号就绪，开发环境可用

- ⬜ **0.1** 创建 Supabase 项目，获取 `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- ⬜ **0.2** 创建 Stripe 账号（或使用已有账号），获取 `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY`
- ⬜ **0.3** 创建 `.env.local` 配置环境变量
- ⬜ **0.4** 安装依赖：`@supabase/supabase-js`、`stripe`、`@stripe/stripe-js`
- ⬜ **0.5** 创建 `src/lib/supabase.ts`（server client + browser client）
- ⬜ **0.6** 创建 `src/lib/stripe.ts`（server-side Stripe 实例）

---

## 阶段 1：静态数据层

> 目标：项目和商品数据可读取、可渲染

- ⬜ **1.1** 创建目录结构：
  ```
  public/data/projects/1/data.json, cover.jpg
  public/data/products/1/data.json, cover.jpg
  ```
- ⬜ **1.2** 创建 TypeScript ID 注册表和类型：
  ```
  src/data/projects.ts   — PROJECTS 常量 + ProjectId 类型
  src/data/products.ts   — PRODUCTS 常量 + ProductId 类型
  ```
- ⬜ **1.3** 创建数据读取工具函数：
  ```
  src/lib/data.ts
    — getProject(id): 读取 data.json + 拼接图片路径
    — getProduct(id): 同上
    — getAllProjects(): 遍历 PROJECTS 常量
    — getAllProducts(): 遍历 PRODUCTS 常量
  ```
- ⬜ **1.4** 填充至少 1 个项目 + 1 个商品的示例数据（占位内容即可）

---

## 阶段 2：数据库

> 目标：`orders` 表和状态机就绪

- ⬜ **2.1** 编写 Supabase migration：创建 `orders` 表（含所有约束）
- ⬜ **2.2** 编写 Supabase migration：创建 `order_status_history` 表
- ⬜ **2.3** 编写状态变更触发器：INSERT 到 `order_status_history`
- ⬜ **2.4** 编写状态转换守卫触发器：阻止非法转换
- ⬜ **2.5** 配置 RLS 策略（公开读取成功订单、管理员完全访问）
- ⬜ **2.6** 创建 `src/lib/order-status.ts`：状态常量、转换规则、分组、颜色
- ⬜ **2.7** 创建 TypeScript 类型：`src/types/order.ts`
- ⬜ **2.8** 运行 migration，验证表结构

---

## 阶段 3：Stripe 一次性支付（捐赠）

> 目标：用户可以为项目进行一次性捐赠

- ⬜ **3.1** 创建 Server Action：`src/app/actions/donate.ts`
  - 验证输入（项目 ID、金额、姓名、邮箱）
  - 创建 `orders` 记录（status: pending）
  - 创建 Stripe Checkout Session（mode: payment）
  - 返回 Checkout URL
- ⬜ **3.2** 创建捐赠页面 UI：`src/app/[locale]/donate/page.tsx`
  - 项目选择
  - 金额输入（预设 + 自定义）
  - 姓名、邮箱、留言
  - 提交按钮 → 跳转 Stripe
- ⬜ **3.3** 创建 Stripe Webhook 入口：`src/app/api/webhooks/stripe/route.ts`
  - 验证 Stripe 签名
  - 处理 `checkout.session.completed` → pending → paid
  - 处理 `checkout.session.expired` → pending → cancelled
- ⬜ **3.4** 配置 Stripe Webhook endpoint（Dashboard 或 CLI）
- ⬜ **3.5** 创建支付成功页：`src/app/[locale]/donate/success/page.tsx`
- ⬜ **3.6** 创建支付取消页：`src/app/[locale]/donate/cancelled/page.tsx`
- ⬜ **3.7** 端到端测试：使用 Stripe 测试卡完成一笔捐赠，验证 webhook 回调和状态更新

---

## 阶段 4：Stripe 一次性支付（商品）

> 目标：用户可以购买商品，复用阶段 3 的 webhook

- ⬜ **4.1** 创建 Server Action：`src/app/actions/purchase.ts`
  - 验证输入（商品 ID、数量、收货地址）
  - 创建 `orders` 记录（type: purchase）
  - 创建 Stripe Checkout Session
  - 返回 Checkout URL
- ⬜ **4.2** 创建商品列表页：`src/app/[locale]/merch/page.tsx`
- ⬜ **4.3** 创建商品详情/购买页：`src/app/[locale]/merch/[id]/page.tsx`
  - 商品信息展示
  - 数量选择
  - 收货地址表单
  - 提交按钮 → 跳转 Stripe
- ⬜ **4.4** 创建支付结果页（可复用捐赠的成功/取消页，或独立创建）
- ⬜ **4.5** 验证 webhook 复用：商品购买的 `checkout.session.completed` 走同一入口
- ⬜ **4.6** 端到端测试

---

## 阶段 5：月捐订阅

> 目标：用户可以选择按月定期捐赠

- ⬜ **5.1** 在 Stripe 创建 Product + 动态 Price（或使用 `price_data`）
- ⬜ **5.2** 扩展 `src/app/actions/donate.ts`：支持 `mode: 'subscription'`
- ⬜ **5.3** 扩展捐赠页 UI：一次性 / 月捐切换
- ⬜ **5.4** 扩展 Webhook：处理 `invoice.paid`（每月扣款成功 → 创建新 order）
- ⬜ **5.5** 扩展 Webhook：处理 `customer.subscription.deleted`（订阅取消 → 记录日志）
- ⬜ **5.6** 创建 Stripe Customer Portal 跳转接口（用户自助管理订阅）
- ⬜ **5.7** 端到端测试：使用 Stripe CLI 模拟订阅周期

---

## 阶段 6：管理后台

> 目标：管理员可查看和处理订单

- ⬜ **6.1** 搭建 Admin 认证（Supabase Auth，admin 角色判断）
- ⬜ **6.2** 创建订单列表页：`src/app/admin/orders/page.tsx`
  - 按类型筛选（捐赠/商品）
  - 按状态筛选
  - 关联显示项目/商品名称（从静态数据读取）
- ⬜ **6.3** 创建订单详情/操作组件
  - 状态转换按钮：paid → completed
  - 商品订单：填写快递单号
  - 捐赠订单：可附加备注
- ⬜ **6.4** 实现 Server Action：`src/app/actions/admin-order.ts`
  - 验证管理员身份
  - 验证状态转换合法性
  - 更新订单状态

---

## 阶段 7：公开展示

> 目标：前端展示捐赠进度和公开捐赠列表

- ⬜ **7.1** 创建 Supabase View：`public_donations`（邮箱脱敏，仅 paid/completed）
- ⬜ **7.2** 项目详情页展示捐赠进度条（已筹 / 目标金额）
- ⬜ **7.3** 捐赠墙/列表：展示最近的公开捐赠（脱敏姓名 + 金额 + 留言）

---

## 阶段 8：邮件通知

> 目标：关键节点自动发邮件

- ⬜ **8.1** 安装 Resend SDK，配置 `RESEND_API_KEY`
- ⬜ **8.2** 创建邮件模板：支付成功通知
- ⬜ **8.3** 创建邮件模板：商品发货通知（含快递单号）
- ⬜ **8.4** 创建邮件模板：月捐扣款确认
- ⬜ **8.5** 在 webhook 和 admin action 中集成发送逻辑

---

## 依赖关系

```
阶段 0（基础设施）
  ↓
阶段 1（静态数据） + 阶段 2（数据库）  ← 可并行
  ↓
阶段 3（捐赠支付）
  ↓
阶段 4（商品支付）  ← 复用阶段 3 的 webhook
  ↓
阶段 5（月捐）     ← 扩展阶段 3
  ↓
阶段 6（管理后台） + 阶段 7（公开展示）  ← 可并行
  ↓
阶段 8（邮件通知）  ← 最后集成
```

---

## 环境变量清单

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend（阶段 8）
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
