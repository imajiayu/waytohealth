'use client';

import { useEffect, useMemo, useState } from 'react';
import { sendOneEmailAction } from '@/app/actions/email';
import { listTemplatesAction, previewEmailAction } from '@/app/actions/emailTemplates';
import type { EmailTemplateMeta, RenderedEmail } from '@/lib/emailTemplatesStore';
import { parseRecipients } from '@/lib/emailRecipients';
import { sendBatch, type RecipientProgress } from '@/lib/emailSendQueue';
import {
  type AttachmentInput,
  EMAIL_ATTACH_MAX_TOTAL_BYTES,
} from '@/lib/emailAttachments';
import AlertBanner from './common/AlertBanner';
import AttachmentPicker from './email/AttachmentPicker';
import {
  FROM_PREFIXES,
  DEFAULT_FROM_PREFIX,
  FROM_DISPLAY_NAME,
  FROM_DOMAIN,
} from '@/lib/emailFrom';
import EmailHistory from './EmailHistory';

type Mode = 'template' | 'custom';

const MAX_TEXT_LEN = 50_000;
const MAX_SUBJECT_LEN = 998;
// 逐封发送并发度（贴合 Resend ~2 req/s；emailSendQueue 内部还有节流 + 429 退避）
const SEND_CONCURRENCY = 2;

export default function EmailPanel() {
  const [templates, setTemplates] = useState<EmailTemplateMeta[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('template');
  const [templateId, setTemplateId] = useState<string>('');
  const [to, setTo] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [subject, setSubject] = useState('');
  const [prefixOption, setPrefixOption] = useState<string>(DEFAULT_FROM_PREFIX);
  const [customPrefix, setCustomPrefix] = useState('');
  const effectiveFromPrefix = prefixOption === '__other__' ? customPrefix.trim() : prefixOption;

  // custom 模式：admin 直接编辑纯文本正文；切换到 custom 时灌入当前模板的 text 作为编辑起点
  const [customText, setCustomText] = useState('');

  const [preview, setPreview] = useState<RenderedEmail | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [progress, setProgress] = useState<RecipientProgress[] | null>(null);
  const [summary, setSummary] = useState<{ sent: number; failed: number } | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const attachTotal = attachments.reduce((sum, a) => sum + a.size, 0);
  const attachOverLimit = attachTotal > EMAIL_ATTACH_MAX_TOTAL_BYTES;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listTemplatesAction();
      if (cancelled) return;
      if (!res.ok) {
        setLoadError(res.error);
        return;
      }
      setTemplates(res.templates);
      if (res.templates.length > 0) {
        const first = res.templates[0];
        setTemplateId(first.id);
        setSubject(first.subject);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTemplate = useMemo(
    () => templates?.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  function selectTemplate(id: string) {
    setTemplateId(id);
    const next = templates?.find((t) => t.id === id);
    setSubject(next?.subject ?? '');
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    if (next === 'custom') {
      if (preview && !customText) {
        setCustomText(preview.text);
      }
    } else {
      const tpl = templates?.find((t) => t.id === templateId);
      if (tpl) setSubject(tpl.subject);
    }
    setMode(next);
  }

  // 模板切换自动拉预览；取消标志避免快速切换时旧请求污染新状态
  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    (async () => {
      const res = await previewEmailAction(templateId);
      if (cancelled) return;
      if (res.ok) {
        setPreview(res.rendered);
        setPreviewError(null);
      } else {
        setPreview(null);
        setPreviewError(res.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSendError(null);
    setSummary(null);

    const parsed = parseRecipients(to);
    if (!parsed.ok) {
      setSendError(parsed.error);
      return;
    }
    if (attachOverLimit) {
      setSendError('Attachments exceed the 40MB per-email limit');
      return;
    }

    const finalSubject = subject.trim();
    const common = {
      subject: finalSubject,
      fromPrefix: effectiveFromPrefix,
      ...(replyTo.trim() ? { replyTo: replyTo.trim() } : {}),
      ...(attachments.length > 0 ? { attachments } : {}),
    };

    // 每封 payload 只换 recipient；template 模式复用客户端已渲染的 html/text，custom 模式纯文本
    let makeSend: (addr: string) => ReturnType<typeof sendOneEmailAction>;
    if (mode === 'template') {
      if (!preview) {
        setSendError('Template preview not ready yet — try again in a moment');
        return;
      }
      const html = preview.html;
      const text = preview.text;
      makeSend = (recipient: string) => sendOneEmailAction({ recipient, ...common, html, text });
    } else {
      const text = customText;
      makeSend = (recipient: string) => sendOneEmailAction({ recipient, ...common, text });
    }

    setSending(true);
    setProgress(parsed.list.map((address) => ({ address, status: 'queued', attempts: 0 })));

    const result = await sendBatch(parsed.list, makeSend, {
      concurrency: SEND_CONCURRENCY,
      onUpdate: setProgress,
    });

    setSending(false);
    setSummary(result);
    setHistoryRefreshKey((value) => value + 1);
  }

  const inputCls =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700';

  if (loadError) {
    return <AlertBanner variant="error">{loadError}</AlertBanner>;
  }

  if (templates === null) {
    return <p className="text-sm text-gray-500">Loading templates…</p>;
  }

  const noTemplates = templates.length === 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a template — or write a one-off subject + body — add attachments, and send via Resend (one email per recipient).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSend}
          className="space-y-5 rounded-md border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div>
            <label htmlFor="email-to" className={labelCls}>
              Recipients
            </label>
            <textarea
              id="email-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              rows={4}
              required
              placeholder={'name@example.com\nanother@example.com'}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-gray-400">
              One address per line. Max 50 recipients per send.
            </p>
          </div>

          <div>
            <span className={labelCls}>Mode</span>
            <div
              role="tablist"
              aria-label="Email mode"
              className="mt-1 inline-flex rounded-md border border-gray-300 bg-gray-50 p-0.5 text-sm"
            >
              {(['template', 'custom'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`rounded px-3 py-1 transition-colors ${
                    mode === m
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'template' ? 'Template' : 'Custom'}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {mode === 'template'
                ? 'Pick an HTML template managed in the Templates tab.'
                : 'Free-form subject + plain-text body. No HTML — recipient sees text as-is.'}
            </p>
          </div>

          {mode === 'template' && (
            <div>
              <label htmlFor="email-template" className={labelCls}>
                Template
              </label>
              {noTemplates ? (
                <p className="mt-1 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500">
                  No templates yet — create one in the Templates tab, or switch to Custom mode.
                </p>
              ) : (
                <select
                  id="email-template"
                  value={templateId}
                  onChange={(e) => selectTemplate(e.target.value)}
                  className={inputCls}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
              {currentTemplate && (
                <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">
                  {currentTemplate.locales.join(' / ')}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email-from-prefix" className={labelCls}>
              From
            </label>
            <div className="mt-1 flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono">
              <span className="text-gray-500">{FROM_DISPLAY_NAME} &lt;</span>
              <select
                id="email-from-prefix"
                value={prefixOption}
                onChange={(e) => setPrefixOption(e.target.value)}
                className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {FROM_PREFIXES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="__other__">Other…</option>
              </select>
              {prefixOption === '__other__' && (
                <input
                  type="text"
                  aria-label="Custom sender prefix"
                  value={customPrefix}
                  onChange={(e) => {
                    const filtered = e.target.value
                      .replace(/[^a-zA-Z0-9._+\-]/g, '')
                      .replace(/^[._+\-]+/, '');
                    setCustomPrefix(filtered);
                  }}
                  placeholder="e.g. hello"
                  maxLength={64}
                  className="w-24 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              )}
              <span className="text-gray-500">@{FROM_DOMAIN}&gt;</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Pick the sender local part. Domain and display name are fixed.
            </p>
          </div>

          <div>
            <label htmlFor="email-subject" className={labelCls}>
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Email subject"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-gray-400">
              {mode === 'template'
                ? 'Pre-filled from the template — edit freely before sending.'
                : 'Free-form subject. Max 998 characters (RFC 5322).'}
            </p>
          </div>

          {mode === 'custom' && (
            <div>
              <label htmlFor="email-text" className={labelCls}>
                Body <span className="text-red-500">*</span>
              </label>
              <textarea
                id="email-text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={14}
                required
                placeholder="Type your message here…"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-400">
                Plain text only. {customText.length.toLocaleString()} / {MAX_TEXT_LEN.toLocaleString()} chars.
              </p>
            </div>
          )}

          <div>
            <AttachmentPicker attachments={attachments} onChange={setAttachments} disabled={sending} />
          </div>

          <div>
            <label htmlFor="email-reply-to" className={labelCls}>
              Reply-To <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="email-reply-to"
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="hello@waytohealth.org.ua"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-gray-400">
              Where recipient replies will go. Leave blank to route to the From address
              {' '}
              (<code>{effectiveFromPrefix || DEFAULT_FROM_PREFIX}@</code>).
            </p>
          </div>

          {sendError && <AlertBanner variant="error">{sendError}</AlertBanner>}

          {progress && <ProgressList progress={progress} summary={summary} />}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={
                sending ||
                !to.trim() ||
                !subject.trim() ||
                subject.trim().length > MAX_SUBJECT_LEN ||
                attachOverLimit ||
                (prefixOption === '__other__' && !customPrefix.trim()) ||
                (mode === 'template'
                  ? noTemplates || !templateId
                  : !customText.trim() || customText.length > MAX_TEXT_LEN)
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Preview
            </span>
            {subject && (
              <span className="max-w-[70%] truncate text-xs text-gray-500" title={subject}>
                {subject}
              </span>
            )}
          </div>

          {mode === 'template' && previewError && (
            <AlertBanner variant="error">{previewError}</AlertBanner>
          )}

          {mode === 'template' && !preview && !previewError && (
            <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              {noTemplates ? 'No template to preview.' : 'Loading preview…'}
            </div>
          )}

          {mode === 'custom' && !customText.trim() && (
            <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              Type a message in the body field to see a live preview.
            </div>
          )}

          {mode === 'template' && preview && (
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
              <iframe
                title="Email preview"
                srcDoc={preview.html}
                sandbox="allow-same-origin"
                className="h-[640px] w-full border-0"
              />
            </div>
          )}

          {mode === 'custom' && customText.trim() && (
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
              <pre className="h-[640px] w-full overflow-auto whitespace-pre-wrap break-words p-4 font-sans text-sm text-gray-800">
                {customText}
              </pre>
            </div>
          )}
        </aside>
      </div>

      <EmailHistory refreshKey={historyRefreshKey} />
    </div>
  );
}

// 逐封发送进度列表 + 最终汇总
function ProgressList({
  progress,
  summary,
}: {
  progress: RecipientProgress[];
  summary: { sent: number; failed: number } | null;
}) {
  const dotCls: Record<RecipientProgress['status'], string> = {
    queued: 'bg-gray-300',
    sending: 'bg-blue-500 animate-pulse',
    sent: 'bg-green-500',
    failed: 'bg-red-500',
  };

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <ul className="max-h-56 space-y-1 overflow-auto text-xs">
        {progress.map((p) => (
          <li key={p.address} className="flex items-start gap-2">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotCls[p.status]}`} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="break-all font-medium text-gray-800">{p.address}</span>
              {p.status === 'sending' && p.attempts > 1 && (
                <span className="text-gray-400"> · retry {p.attempts}</span>
              )}
              {p.status === 'failed' && p.error && (
                <span className="block break-words text-red-600">{p.error}</span>
              )}
            </span>
            <span className="shrink-0 text-gray-400">{p.status}</span>
          </li>
        ))}
      </ul>
      {summary && (
        <div
          className={`mt-2 border-t pt-2 text-sm ${
            summary.failed === 0 ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-800'
          }`}
        >
          Sent to {summary.sent} recipient{summary.sent === 1 ? '' : 's'}
          {summary.failed > 0 && ` · ${summary.failed} failed`}
        </div>
      )}
    </div>
  );
}
