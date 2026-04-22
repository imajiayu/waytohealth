'use client';

import { startTransition, useEffect, useState } from 'react';
import { listEmailHistoryAction, type EmailHistoryItem } from '@/app/actions/email';

type HistoryResult =
  | { kind: 'loading' }
  | { kind: 'error'; error: string }
  | { kind: 'success'; emails: EmailHistoryItem[]; hasMore: boolean };

const STATUS_STYLES: Record<EmailHistoryItem['lastEvent'], string> = {
  bounced: 'bg-red-50 text-red-700 ring-red-200',
  canceled: 'bg-gray-100 text-gray-700 ring-gray-200',
  clicked: 'bg-sky-50 text-sky-700 ring-sky-200',
  complained: 'bg-amber-50 text-amber-700 ring-amber-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  delivery_delayed: 'bg-orange-50 text-orange-700 ring-orange-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  opened: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  queued: 'bg-violet-50 text-violet-700 ring-violet-200',
  scheduled: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  sent: 'bg-blue-50 text-blue-700 ring-blue-200',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMATTER.format(date);
}

function joinAddresses(values: string[]) {
  return values.length > 0 ? values.join(', ') : '—';
}

export default function EmailHistory({ refreshKey }: { refreshKey: number }) {
  const [result, setResult] = useState<HistoryResult>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  async function loadHistory() {
    setRefreshing(true);
    const res = await listEmailHistoryAction();
    if (res.ok) {
      setResult({ kind: 'success', emails: res.emails, hasMore: res.hasMore });
    } else {
      setResult({ kind: 'error', error: res.error });
    }
    setRefreshing(false);
  }

  useEffect(() => {
    startTransition(() => {
      void loadHistory();
    });
  }, [refreshKey]);

  return (
    <section className="mt-5 rounded-md border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Send history</h2>
          <p className="mt-1 text-xs text-gray-500">
            Latest 20 emails from Resend for this workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              void loadHistory();
            });
          }}
          disabled={refreshing}
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {result.kind === 'loading' ? (
        <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
          Loading send history…
        </div>
      ) : null}

      {result.kind === 'error' ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {result.error}
        </div>
      ) : null}

      {result.kind === 'success' && result.emails.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
          No emails found in Resend yet.
        </div>
      ) : null}

      {result.kind === 'success' && result.emails.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
          <table className="w-full table-fixed divide-y divide-gray-200 text-xs">
            <colgroup>
              <col className="w-[8.5rem]" />
              <col />
              <col className="w-[18rem]" />
              <col className="w-[7rem]" />
            </colgroup>
            <thead className="bg-gray-50">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-3 py-2.5 font-medium">Sent</th>
                <th className="px-3 py-2.5 font-medium">Message</th>
                <th className="px-3 py-2.5 font-medium">Recipients</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {result.emails.map((email) => (
                <tr key={email.id} className="align-top">
                  <td className="px-3 py-2.5 text-gray-600">
                    <div className="whitespace-nowrap">{formatDate(email.createdAt)}</div>
                    {email.scheduledAt && (
                      <p className="mt-1 truncate text-[11px] text-gray-500" title={email.scheduledAt}>
                        Sched. {formatDate(email.scheduledAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="truncate font-medium text-gray-900" title={email.subject}>
                      {email.subject}
                    </div>
                    <p className="mt-1 truncate text-[11px] text-gray-500" title={email.from}>
                      From: {email.from}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">
                    {(() => {
                      const list = email.bcc.length > 0 ? email.bcc : email.to;
                      if (list.length === 0) return <span className="text-gray-400">—</span>;
                      return (
                        <ul className="max-h-32 space-y-0.5 overflow-y-auto pr-1">
                          {list.map((addr, idx) => (
                            <li key={`${addr}-${idx}`} className="break-all">{addr}</li>
                          ))}
                        </ul>
                      );
                    })()}
                    {email.replyTo.length > 0 && (
                      <p className="mt-1 break-all text-[11px] text-gray-500" title={joinAddresses(email.replyTo)}>
                        Reply-To: {joinAddresses(email.replyTo)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset ${
                        STATUS_STYLES[email.lastEvent]
                      }`}
                    >
                      {email.lastEvent.replaceAll('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.hasMore && (
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
              Resend has more records than shown here. This panel currently displays the latest 20.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
