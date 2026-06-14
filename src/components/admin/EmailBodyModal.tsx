'use client';

import FocusTrap from 'focus-trap-react';
import { Download, Paperclip, X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { EmailBody } from '@/app/actions/email';
import { formatBytes, formatDate } from './emailFormat';
import AlertBanner from './common/AlertBanner';

interface EmailBodyModalProps {
  loading: boolean;
  error: string | null;
  body: EmailBody | null;
  onClose: () => void;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 text-gray-400">{label}</dt>
      <dd className="break-all text-gray-600">{value}</dd>
    </div>
  );
}

export default function EmailBodyModal({ loading, error, body, onClose }: EmailBodyModalProps) {
  useBodyScrollLock(true);
  useEscapeKey(true, onClose);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <FocusTrap
      focusTrapOptions={{
        escapeDeactivates: false,
        clickOutsideDeactivates: false,
        allowOutsideClick: true,
      }}
    >
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Email body"
        onClick={onClose}
      >
        <div
          className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
          onClick={stop}
        >
          {/* header */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
            <div className="min-w-0">
              <h3
                className="truncate text-base font-semibold text-gray-900"
                title={body?.subject || undefined}
              >
                {body?.subject || (loading ? 'Loading…' : 'Email')}
              </h3>
              {body && (
                <dl className="mt-1.5 space-y-0.5 text-xs">
                  <MetaRow label="From:" value={body.from} />
                  {body.to.length > 0 && <MetaRow label="To:" value={body.to.join(', ')} />}
                  {body.cc.length > 0 && <MetaRow label="Cc:" value={body.cc.join(', ')} />}
                  <MetaRow label="Date:" value={formatDate(body.createdAt)} />
                </dl>
              )}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* attachments */}
          {body && body.attachments.length > 0 && (
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                <Paperclip className="h-3.5 w-3.5" />
                Attachments ({body.attachments.length})
              </div>
              <ul className="flex flex-wrap gap-2">
                {body.attachments.map((att) => (
                  <li key={att.id}>
                    <a
                      href={`/api/admin/email/attachment?emailId=${encodeURIComponent(
                        body.id
                      )}&id=${encodeURIComponent(att.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="max-w-[12rem] truncate" title={att.filename}>
                        {att.filename}
                      </span>
                      <span className="shrink-0 text-gray-400">{formatBytes(att.size)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* body */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {loading && (
              <div className="p-10 text-center text-sm text-gray-500">Loading email…</div>
            )}

            {!loading && error && (
              <div className="p-5">
                <AlertBanner variant="error">{error}</AlertBanner>
              </div>
            )}

            {!loading && !error && body && (
              body.html ? (
                <iframe
                  title="Email body"
                  srcDoc={body.html}
                  sandbox="allow-same-origin"
                  className="h-[60vh] w-full border-0"
                />
              ) : (
                <pre className="h-[60vh] w-full overflow-auto whitespace-pre-wrap break-words p-5 font-sans text-sm text-gray-800">
                  {body.text || '(No content)'}
                </pre>
              )
            )}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
