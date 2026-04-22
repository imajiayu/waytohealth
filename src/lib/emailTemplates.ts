import 'server-only';
import {
  PARTNERSHIP_INVITE_UA_HTML,
  PARTNERSHIP_INVITE_UA_SUBJECT,
  PARTNERSHIP_INVITE_UA_TEXT,
} from './emailTemplates/partnershipInviteUa';
import {
  PARTNERSHIP_INVITE_EN_HTML,
  PARTNERSHIP_INVITE_EN_SUBJECT,
  PARTNERSHIP_INVITE_EN_TEXT,
} from './emailTemplates/partnershipInviteEn';

// 邮件模板注册表：纯静态 HTML 模板。客户端只能选 id，不传任何变量。
// 整封 subject/html/text 都是常量，渲染时原样返回 —— 不做任何字符串拼接或转义。
// 新增模板：在 emailTemplates/ 目录下加一个 <name>.ts 导出常量，然后在 TEMPLATES 数组追加一项。

export type EmailLocale = 'ua' | 'en';

export interface EmailTemplateMeta {
  id: string;
  name: string;
  description: string;
  locales: EmailLocale[];
  subject: string; // 默认主题，UI 选中模板时 pre-fill 到输入框
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  locales: EmailLocale[];
  rendered: RenderedEmail;
}

const TEMPLATES: EmailTemplate[] = [
  {
    id: 'partnership-invite-ua',
    name: 'Partnership invite (UA)',
    description: 'Cold-outreach letter to prospective partners (Ukrainian).',
    locales: ['ua'],
    rendered: {
      subject: PARTNERSHIP_INVITE_UA_SUBJECT,
      html: PARTNERSHIP_INVITE_UA_HTML,
      text: PARTNERSHIP_INVITE_UA_TEXT,
    },
  },
  {
    id: 'partnership-invite-en',
    name: 'Partnership invite (EN)',
    description: 'Cold-outreach letter to prospective partners (English).',
    locales: ['en'],
    rendered: {
      subject: PARTNERSHIP_INVITE_EN_SUBJECT,
      html: PARTNERSHIP_INVITE_EN_HTML,
      text: PARTNERSHIP_INVITE_EN_TEXT,
    },
  },
];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function listTemplates(): EmailTemplateMeta[] {
  return TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    locales: t.locales,
    subject: t.rendered.subject,
  }));
}

export function renderEmail(
  id: string
): { ok: true; rendered: RenderedEmail } | { ok: false; error: string } {
  const tpl = BY_ID.get(id);
  if (!tpl) return { ok: false, error: 'unknown template' };
  return { ok: true, rendered: tpl.rendered };
}
