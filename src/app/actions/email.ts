'use server';

import { ensureAdmin } from '@/lib/adminSession';
import {
  getResend,
  buildFromAddress,
  isFromPrefix,
  isValidPrefixFormat,
  DEFAULT_FROM_PREFIX,
} from '@/lib/resend';
import {
  listTemplates,
  renderEmail,
  type EmailTemplateMeta,
  type RenderedEmail,
} from '@/lib/emailTemplates';
import { EMAIL_RE_BATCH as EMAIL_RE } from '@/lib/email';
import { sanitizeInboundHtml } from '@/lib/emailSanitize';
import { errorMessage } from '@/lib/errors';

const MAX_RECIPIENTS = 50; // Resend 单次最多 50
const MAX_SUBJECT_LEN = 998; // RFC 5322 line length
const MAX_TEXT_LEN = 50_000;

function parseRecipients(raw: string): { ok: true; list: string[] } | { ok: false; error: string } {
  // 只按换行分隔，避免邮箱地址内特殊字符（+、.）被误分割
  const parts = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return { ok: false, error: 'No recipients' };
  if (parts.length > MAX_RECIPIENTS) {
    return { ok: false, error: `Too many recipients (max ${MAX_RECIPIENTS})` };
  }

  const invalid = parts.find((e) => !EMAIL_RE.test(e) || e.length > 254);
  if (invalid) return { ok: false, error: `Invalid address: ${invalid}` };

  const seen = new Set<string>();
  const list: string[] = [];
  for (const e of parts) {
    const key = e.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      list.push(e);
    }
  }

  return { ok: true, list };
}

export async function listTemplatesAction(): Promise<
  { ok: true; templates: EmailTemplateMeta[] } | { ok: false; error: string }
> {
  const guard = await ensureAdmin();
  if (guard) return guard;
  return { ok: true, templates: listTemplates() };
}

export async function previewEmailAction(
  templateId: string
): Promise<{ ok: true; rendered: RenderedEmail } | { ok: false; error: string }> {
  const guard = await ensureAdmin();
  if (guard) return guard;
  return renderEmail(templateId);
}

interface SendCommon {
  to: string; // 原始字符串，服务端解析
  subject: string; // 必填
  fromPrefix?: string; // 发件人本地部分；未给 / 格式非法则回落到默认
  replyTo?: string;
}

// template 模式：选注册表里的静态模板，subject 以模板默认值 pre-fill 后可编辑，html/text 用模板常量
// custom 模式：admin 完全自定义 subject + 纯文本正文（不含 HTML），跳过模板注册表。受 cookie session + 长度上限护栏
export type SendInput =
  | (SendCommon & { mode: 'template'; templateId: string })
  | (SendCommon & { mode: 'custom'; text: string });

export interface EmailHistoryItem {
  id: string;
  createdAt: string;
  from: string;
  to: string[];
  bcc: string[];
  cc: string[];
  replyTo: string[];
  subject: string;
  lastEvent:
    | 'bounced'
    | 'canceled'
    | 'clicked'
    | 'complained'
    | 'delivered'
    | 'delivery_delayed'
    | 'failed'
    | 'opened'
    | 'queued'
    | 'scheduled'
    | 'sent';
  scheduledAt: string | null;
}

const EMAIL_HISTORY_LIMIT = 100;

export async function listEmailHistoryAction(): Promise<
  { ok: true; emails: EmailHistoryItem[]; hasMore: boolean } | { ok: false; error: string }
> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  let resend: ReturnType<typeof getResend>;
  try {
    resend = getResend();
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'resend misconfigured') };
  }

  try {
    const { data, error } = await resend.emails.list({ limit: EMAIL_HISTORY_LIMIT });
    if (error) {
      return { ok: false, error: error.message || 'Resend API error' };
    }

    return {
      ok: true,
      emails: (data?.data ?? []).map((email) => ({
        id: email.id,
        createdAt: email.created_at,
        from: email.from,
        to: email.to ?? [],
        bcc: email.bcc ?? [],
        cc: email.cc ?? [],
        replyTo: email.reply_to ?? [],
        subject: email.subject,
        lastEvent: email.last_event,
        scheduledAt: email.scheduled_at,
      })),
      hasMore: data?.has_more ?? false,
    };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// —— 收件箱（Resend Inbound）——

export interface ReceivedEmailItem {
  id: string;
  createdAt: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  attachmentCount: number;
}

/** 收件记录列表：Resend Inbound 收到的最近 100 封（仅 metadata，正文按需懒拉）。 */
export async function listReceivedHistoryAction(): Promise<
  { ok: true; emails: ReceivedEmailItem[]; hasMore: boolean } | { ok: false; error: string }
> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  let resend: ReturnType<typeof getResend>;
  try {
    resend = getResend();
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'resend misconfigured') };
  }

  try {
    const { data, error } = await resend.emails.receiving.list({ limit: EMAIL_HISTORY_LIMIT });
    if (error) {
      return { ok: false, error: error.message || 'Resend API error' };
    }

    return {
      ok: true,
      emails: (data?.data ?? []).map((email) => ({
        id: email.id,
        createdAt: email.created_at,
        from: email.from,
        to: email.to ?? [],
        cc: email.cc ?? [],
        subject: email.subject,
        attachmentCount: Array.isArray(email.attachments) ? email.attachments.length : 0,
      })),
      hasMore: data?.has_more ?? false,
    };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

// —— 单封邮件正文（点击列表行时懒拉）——

export interface EmailAttachmentMeta {
  id: string;
  filename: string;
  size: number;
  contentType: string;
}

export interface EmailBody {
  id: string;
  kind: 'sent' | 'received';
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  createdAt: string;
  html: string | null;
  text: string | null;
  attachments: EmailAttachmentMeta[];
}

/**
 * 拉单封邮件正文。
 * - sent：`emails.get` 返回我们自己发的内容（受审过的模板 / 纯文本），html 原样返回。
 * - received：`emails.receiving.get` 返回外部不可信 HTML，server 侧先过 sanitize 再回（纵深防御，
 *   和入站转发同一套白名单）。附件仅返回 metadata，下载走 /api/admin/email/attachment 代理。
 */
export async function getEmailBodyAction(
  input: { kind: 'sent' | 'received'; id: string }
): Promise<{ ok: true; body: EmailBody } | { ok: false; error: string }> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  if (input.kind !== 'sent' && input.kind !== 'received') {
    return { ok: false, error: 'Invalid kind' };
  }
  if (typeof input.id !== 'string' || !input.id) {
    return { ok: false, error: 'Missing email id' };
  }

  let resend: ReturnType<typeof getResend>;
  try {
    resend = getResend();
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'resend misconfigured') };
  }

  try {
    if (input.kind === 'sent') {
      const { data, error } = await resend.emails.get(input.id);
      if (error) return { ok: false, error: error.message || 'Resend API error' };
      if (!data) return { ok: false, error: 'Email not found' };
      return {
        ok: true,
        body: {
          id: data.id,
          kind: 'sent',
          subject: data.subject,
          from: data.from,
          to: data.to ?? [],
          cc: data.cc ?? [],
          createdAt: data.created_at,
          html: data.html ?? null,
          text: data.text ?? null,
          attachments: [], // 我们的发送流程（模板 / custom）不带附件
        },
      };
    }

    const { data, error } = await resend.emails.receiving.get(input.id);
    if (error) return { ok: false, error: error.message || 'Resend API error' };
    if (!data) return { ok: false, error: 'Email not found' };
    return {
      ok: true,
      body: {
        id: data.id,
        kind: 'received',
        subject: data.subject,
        from: data.from,
        to: data.to ?? [],
        cc: data.cc ?? [],
        createdAt: data.created_at,
        html: data.html ? sanitizeInboundHtml(data.html) : null,
        text: data.text ?? null,
        attachments: (data.attachments ?? []).map((a) => ({
          id: a.id,
          filename: a.filename || `attachment-${a.id}`,
          size: a.size,
          contentType: a.content_type,
        })),
      },
    };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export interface RecipientFailure {
  address: string;
  message: string;
}

export async function sendEmailAction(
  input: SendInput
): Promise<
  | {
      ok: true;
      sent: number;
      failed: number;
      failures: RecipientFailure[];
      rendered: RenderedEmail;
    }
  | { ok: false; error: string }
> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  const parsed = parseRecipients(input.to);
  if (!parsed.ok) return parsed;

  if (input.replyTo && !EMAIL_RE.test(input.replyTo)) {
    return { ok: false, error: `Invalid reply-to: ${input.replyTo}` };
  }

  const finalSubject = input.subject?.trim();
  if (!finalSubject) {
    return { ok: false, error: 'Subject is required' };
  }
  if (finalSubject.length > MAX_SUBJECT_LEN) {
    return { ok: false, error: `Subject too long (max ${MAX_SUBJECT_LEN} chars)` };
  }
  // subject 是邮件 header，过 CRLF 防御性拦截（Resend JSON API 已不会拼 SMTP 文本，纯加固）
  if (/[\r\n]/.test(finalSubject)) {
    return { ok: false, error: 'Subject must not contain line breaks' };
  }

  let html: string | undefined;
  let text: string;
  if (input.mode === 'template') {
    const rendered = renderEmail(input.templateId);
    if (!rendered.ok) return rendered;
    html = rendered.rendered.html;
    text = rendered.rendered.text;
  } else {
    const customText = input.text?.trim();
    if (!customText) return { ok: false, error: 'Text body is required' };
    if (customText.length > MAX_TEXT_LEN) {
      return { ok: false, error: `Text too long (max ${MAX_TEXT_LEN} chars)` };
    }
    text = customText;
  }

  // 白名单前缀直接通过；自定义前缀校验格式（Resend 会进一步校验域名是否已验证）
  if (input.fromPrefix !== undefined && !isFromPrefix(input.fromPrefix) && !isValidPrefixFormat(input.fromPrefix)) {
    return { ok: false, error: `Invalid from prefix: ${String(input.fromPrefix)}` };
  }
  const prefix: string = input.fromPrefix ?? DEFAULT_FROM_PREFIX;

  let resend: ReturnType<typeof getResend>;
  let from: string;
  try {
    resend = getResend();
    from = buildFromAddress(prefix);
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'resend misconfigured') };
  }

  try {
    // 每个收件人一封独立邮件（batch.send），to 是真实地址
    // 旧的 to=from + bcc 群发会被 Gmail/Outlook 反垃圾启发命中（Mail-from = Rcpt-to），
    // 实测整封 bounced。每封独立寄出，收件人本来就互不可见，隐私维度等价。
    // permissive 模式下单封失败不阻塞其余成功投递，errors[].index 映射回 parsed.list 拿地址。
    const messages = parsed.list.map((addr) => ({
      from,
      to: [addr],
      subject: finalSubject,
      ...(html ? { html } : {}),
      text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    }));

    const { data, error } = await resend.batch.send(messages, { batchValidation: 'permissive' });

    if (error) {
      return { ok: false, error: error.message || 'Resend API error' };
    }

    const successCount = data?.data?.length ?? 0;
    const failures: RecipientFailure[] = (data?.errors ?? []).map((e) => ({
      address: parsed.list[e.index] ?? `index ${e.index}`,
      message: e.message,
    }));

    return {
      ok: true,
      sent: successCount,
      failed: failures.length,
      failures,
      rendered: { subject: finalSubject, html: html ?? '', text },
    };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
