'use server';

import { requireAdmin } from '@/lib/adminSession';
import { getResend, getFromAddress } from '@/lib/resend';
import {
  listTemplates,
  renderEmail,
  type EmailTemplateMeta,
  type RenderedEmail,
} from '@/lib/emailTemplates';

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const MAX_RECIPIENTS = 50; // Resend 单次最多 50

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
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }
  return { ok: true, templates: listTemplates() };
}

export async function previewEmailAction(
  templateId: string
): Promise<{ ok: true; rendered: RenderedEmail } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }
  return renderEmail(templateId);
}

export interface SendInput {
  to: string; // 原始字符串，服务端解析
  templateId: string;
  subject: string; // 必填，UI 以模板默认主题 pre-fill
  replyTo?: string;
}

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

const EMAIL_HISTORY_LIMIT = 20;

export async function listEmailHistoryAction(): Promise<
  { ok: true; emails: EmailHistoryItem[]; hasMore: boolean } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }

  let resend: ReturnType<typeof getResend>;
  try {
    resend = getResend();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'resend misconfigured' };
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
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function sendEmailAction(
  input: SendInput
): Promise<
  | { ok: true; sent: number; resendId: string | null; rendered: RenderedEmail }
  | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }

  const parsed = parseRecipients(input.to);
  if (!parsed.ok) return parsed;

  if (input.replyTo && !EMAIL_RE.test(input.replyTo)) {
    return { ok: false, error: `Invalid reply-to: ${input.replyTo}` };
  }

  const finalSubject = input.subject?.trim();
  if (!finalSubject) {
    return { ok: false, error: 'Subject is required' };
  }

  const rendered = renderEmail(input.templateId);
  if (!rendered.ok) return rendered;

  let resend: ReturnType<typeof getResend>;
  let from: string;
  try {
    resend = getResend();
    from = getFromAddress();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'resend misconfigured' };
  }

  try {
    // 全员塞 bcc，to 用 from 地址占位
    // 冷启动邀约信直接塞 to 会让互不认识的潜在伙伴互相看到名单
    const { data, error } = await resend.emails.send({
      from,
      to: from,
      bcc: parsed.list,
      subject: finalSubject,
      html: rendered.rendered.html,
      text: rendered.rendered.text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    if (error) {
      return { ok: false, error: error.message || 'Resend API error' };
    }

    return {
      ok: true,
      sent: parsed.list.length,
      resendId: data?.id ?? null,
      rendered: { subject: finalSubject, html: rendered.rendered.html, text: rendered.rendered.text },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}
