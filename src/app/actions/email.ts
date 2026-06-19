'use server';

import { ensureAdmin } from '@/lib/adminSession';
import {
  getResend,
  buildFromAddress,
  isFromPrefix,
  isValidPrefixFormat,
  DEFAULT_FROM_PREFIX,
} from '@/lib/resend';
import { EMAIL_RE_BATCH as EMAIL_RE } from '@/lib/email';
import { sanitizeInboundHtml } from '@/lib/emailSanitize';
import { errorMessage } from '@/lib/errors';
import { isBlobUrl } from '@/lib/blobUrl';
import {
  type AttachmentInput,
  EMAIL_ATTACH_ALLOWED_MIME,
  EMAIL_ATTACH_MAX_FILE_BYTES,
} from '@/lib/emailAttachments';

const MAX_SUBJECT_LEN = 998; // RFC 5322 line length
const MAX_TEXT_LEN = 50_000;

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
          attachments: [], // sent 历史不回填附件 metadata（附件本体留在 Blob email-attachments/，可追溯）
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

interface SendOneCommon {
  recipient: string; // 单个收件人地址
  subject: string; // 必填
  fromPrefix?: string; // 发件人本地部分；未给 / 格式非法则回落到默认
  replyTo?: string;
  attachments?: AttachmentInput[]; // 已上传到 Blob email-attachments/ 的附件
}

// template 模式：客户端先调 previewEmailAction 拿到 html/text，再把它们传进来（避免每封重读 Blob）
// custom 模式：纯文本，无 html
export type SendOneInput =
  | (SendOneCommon & { html: string; text: string })
  | (SendOneCommon & { text: string; html?: undefined });

type SendOneResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * 发送单封邮件（客户端逐封编排时每个收件人调一次，自控并发见 src/lib/emailSendQueue.ts）。
 * 改用 resend.emails.send 而非 batch.send —— 只有单封 API 支持 attachments。
 * 服务端对单地址 / subject / 附件做纵深校验（客户端校验只是 UX，不是信任边界）。
 */
export async function sendOneEmailAction(input: SendOneInput): Promise<SendOneResult> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  const recipient = (input.recipient ?? '').trim();
  if (!recipient || !EMAIL_RE.test(recipient) || recipient.length > 254) {
    return { ok: false, error: `Invalid recipient: ${recipient || '(empty)'}` };
  }

  if (input.replyTo && !EMAIL_RE.test(input.replyTo)) {
    return { ok: false, error: `Invalid reply-to: ${input.replyTo}` };
  }

  const finalSubject = input.subject?.trim();
  if (!finalSubject) return { ok: false, error: 'Subject is required' };
  if (finalSubject.length > MAX_SUBJECT_LEN) {
    return { ok: false, error: `Subject too long (max ${MAX_SUBJECT_LEN} chars)` };
  }
  // subject 是邮件 header，过 CRLF 防御性拦截
  if (/[\r\n]/.test(finalSubject)) {
    return { ok: false, error: 'Subject must not contain line breaks' };
  }

  // html 存在 → template 模式（text 为可选 fallback）；否则 custom 模式（text 必填）
  const html = typeof input.html === 'string' && input.html.length > 0 ? input.html : undefined;
  let text: string;
  if (html) {
    text = typeof input.text === 'string' ? input.text : '';
  } else {
    const t = (input.text ?? '').trim();
    if (!t) return { ok: false, error: 'Text body is required' };
    if (t.length > MAX_TEXT_LEN) {
      return { ok: false, error: `Text too long (max ${MAX_TEXT_LEN} chars)` };
    }
    text = t;
  }

  // 附件纵深校验：必须是本服务上传到 Blob email-attachments/ 的文件，拒绝任意外链（防 SSRF：path 会被 Resend 主动拉取）
  const attachments = input.attachments ?? [];
  for (const a of attachments) {
    if (!a || typeof a.url !== 'string' || !isBlobUrl(a.url) || !a.url.includes('/email-attachments/')) {
      return { ok: false, error: 'Invalid attachment url' };
    }
    if (typeof a.filename !== 'string' || !a.filename) {
      return { ok: false, error: 'Attachment missing filename' };
    }
    if (!EMAIL_ATTACH_ALLOWED_MIME.includes(a.contentType)) {
      return { ok: false, error: `Attachment type not allowed: ${a.contentType}` };
    }
    if (typeof a.size !== 'number' || a.size > EMAIL_ATTACH_MAX_FILE_BYTES) {
      return { ok: false, error: `Attachment too large: ${a.filename}` };
    }
  }

  // 白名单前缀直接通过；自定义前缀校验格式（Resend 会进一步校验域名是否已验证）
  if (
    input.fromPrefix !== undefined &&
    !isFromPrefix(input.fromPrefix) &&
    !isValidPrefixFormat(input.fromPrefix)
  ) {
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
    const { data, error } = await resend.emails.send({
      from,
      to: [recipient],
      subject: finalSubject,
      ...(html ? { html } : {}),
      text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      ...(attachments.length > 0
        ? {
            attachments: attachments.map((a) => ({
              filename: a.filename,
              path: a.url, // Resend 自己去拉远程 URL，server 不重复下载
              contentType: a.contentType,
            })),
          }
        : {}),
    });

    if (error) return { ok: false, error: error.message || 'Resend API error' };
    if (!data) return { ok: false, error: 'Resend returned no id' };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
