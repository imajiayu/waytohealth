# Way to Health - 康复中心网站

> 乌克兰 Way to Health 慈善基金会旗下康复中心的独立全功能网站，支持项目展示、在线支付和捐赠管理

---

## 项目概述

**域名**: https://waytohealth.org.ua/
**组织**: Way to Health 慈善基金会（乌克兰）
**定位**: 独立全功能站 — 康复中心宣传 + 项目展示 + Stripe 收款 + 捐赠管理
**关联项目**: [NGO_web](~/NGO_web) - Way to Future UA 综合慈善平台（waytofutureua.org.ua）

### 与 NGO_web 的关系

- NGO_web 是 Way to Future UA 的综合慈善平台（waytofutureua.org.ua）
- 本站是 Way to Health 的独立网站，拥有自己的 Supabase 和 Stripe
- 两站共享设计语言和技术模式，但后端完全独立
- 未来可考虑两站之间的品牌联动（互相链接等）

---

## 技术栈

| 类型 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js 14 (App Router), TypeScript, Tailwind CSS | 与 NGO_web 一致 |
| 国际化 | next-intl | 支持 ua (乌克兰语) + en (英语) |
| 后端 | Supabase (PostgreSQL + Auth) | 独立实例 |
| 支付 | Stripe | 法币支付（信用卡、Apple Pay、Google Pay） |
| 邮件 | Resend | 捐赠通知、订阅邮件 |
| 部署 | Vercel | 与 NGO_web 一致 |
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

## 交流语言

始终使用中文与用户交流
