'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listTemplatesAction,
  previewEmailAction,
  sendEmailAction,
  type RecipientFailure,
} from '@/app/actions/email';
import type { EmailTemplateMeta, RenderedEmail } from '@/lib/emailTemplates';
import {
  FROM_PREFIXES,
  DEFAULT_FROM_PREFIX,
  FROM_DISPLAY_NAME,
  FROM_DOMAIN,
  isFromPrefix,
  type FromPrefix,
} from '@/lib/emailFrom';
import EmailHistory from './EmailHistory';

type SendResult =
  | { kind: 'success'; sent: number; failed: number; failures: RecipientFailure[] }
  | { kind: 'error'; error: string }
  | null;

export default function EmailPanel() {
  const [templates, setTemplates] = useState<EmailTemplateMeta[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState<string>('');
  const [to, setTo] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [subject, setSubject] = useState('');
  const [fromPrefix, setFromPrefix] = useState<FromPrefix>(DEFAULT_FROM_PREFIX);

  const [preview, setPreview] = useState<RenderedEmail | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [sendBusy, setSendBusy] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

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
    return () => { cancelled = true; };
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
    return () => { cancelled = true; };
  }, [templateId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId) return;
    setSendBusy(true);
    setSendResult(null);

    const res = await sendEmailAction({
      to,
      templateId,
      subject: subject.trim(),
      fromPrefix,
      ...(replyTo.trim() ? { replyTo: replyTo.trim() } : {}),
    });

    setSendBusy(false);
    if (!res.ok) {
      setSendResult({ kind: 'error', error: res.error });
      return;
    }
    setSendResult({
      kind: 'success',
      sent: res.sent,
      failed: res.failed,
      failures: res.failures,
    });
    setPreview(res.rendered);
    setHistoryRefreshKey((value) => value + 1);
  }

  const inputCls =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700';

  if (loadError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  if (templates === null) {
    return <p className="text-sm text-gray-500">Loading templates…</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a static HTML template, enter recipients, and send via Resend.
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
            <label htmlFor="email-template" className={labelCls}>
              Template
            </label>
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
            {currentTemplate && (
              <p className="mt-1 text-xs text-gray-500">
                {currentTemplate.description}
                {' · '}
                <span className="uppercase tracking-wider">
                  {currentTemplate.locales.join(' / ')}
                </span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email-from-prefix" className={labelCls}>
              From
            </label>
            <div className="mt-1 flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono">
              <span className="text-gray-500">{FROM_DISPLAY_NAME} &lt;</span>
              <select
                id="email-from-prefix"
                value={fromPrefix}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isFromPrefix(v)) setFromPrefix(v);
                }}
                className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {FROM_PREFIXES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
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
              Pre-filled from the template — edit freely before sending.
            </p>
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
              (<code>{fromPrefix}@</code>).
            </p>
          </div>

          {sendResult?.kind === 'error' && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {sendResult.error}
            </div>
          )}
          {sendResult?.kind === 'success' && (
            <div
              className={`rounded-md border p-3 text-sm ${
                sendResult.failed === 0
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <div>
                Sent to {sendResult.sent} recipient{sendResult.sent === 1 ? '' : 's'}
                {sendResult.failed > 0 && ` · ${sendResult.failed} failed`}
              </div>
              {sendResult.failures.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {sendResult.failures.map((f) => (
                    <li key={f.address} className="break-all">
                      <span className="font-medium">{f.address}</span> — {f.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={sendBusy || !templateId || !to.trim() || !subject.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sendBusy ? 'Sending…' : 'Send'}
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

          {previewError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {previewError}
            </div>
          )}

          {!preview && !previewError && (
            <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              Loading preview…
            </div>
          )}

          {preview && (
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
              <iframe
                title="Email preview"
                srcDoc={preview.html}
                sandbox="allow-same-origin"
                className="h-[640px] w-full border-0"
              />
            </div>
          )}
        </aside>
      </div>

      <EmailHistory refreshKey={historyRefreshKey} />
    </div>
  );
}
