'use client';

import { startTransition, useEffect, useState } from 'react';
import {
  listEmailHistoryAction,
  listReceivedHistoryAction,
  getEmailBodyAction,
  type EmailHistoryItem,
  type ReceivedEmailItem,
  type EmailBody,
} from '@/app/actions/email';
import AlertBanner from './common/AlertBanner';
import EmailBodyModal from './EmailBodyModal';
import { formatDate, joinAddresses } from './emailFormat';

type Tab = 'sent' | 'received';

type SentResult =
  | { kind: 'loading' }
  | { kind: 'error'; error: string }
  | { kind: 'success'; emails: EmailHistoryItem[]; hasMore: boolean };

type ReceivedResult =
  | { kind: 'loading' }
  | { kind: 'error'; error: string }
  | { kind: 'success'; emails: ReceivedEmailItem[]; hasMore: boolean };

type ModalState =
  | { open: false }
  | { open: true; kind: Tab; id: string; loading: boolean; error: string | null; body: EmailBody | null };

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

// 行内可点击的 subject 按钮：点开正文 modal
function SubjectButton({ subject, onClick }: { subject: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={subject || undefined}
      className="block w-full truncate text-left font-medium text-blue-700 hover:underline"
    >
      {subject || '(no subject)'}
    </button>
  );
}

export default function EmailHistory({ refreshKey }: { refreshKey: number }) {
  const [tab, setTab] = useState<Tab>('sent');
  const [sent, setSent] = useState<SentResult>({ kind: 'loading' });
  const [received, setReceived] = useState<ReceivedResult | null>(null); // null = 尚未加载（切到 receive 时懒拉）
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<ModalState>({ open: false });

  async function loadSent() {
    setRefreshing(true);
    setSent({ kind: 'loading' });
    const res = await listEmailHistoryAction();
    setSent(res.ok ? { kind: 'success', emails: res.emails, hasMore: res.hasMore } : { kind: 'error', error: res.error });
    setRefreshing(false);
  }

  async function loadReceived() {
    setRefreshing(true);
    setReceived({ kind: 'loading' });
    const res = await listReceivedHistoryAction();
    setReceived(res.ok ? { kind: 'success', emails: res.emails, hasMore: res.hasMore } : { kind: 'error', error: res.error });
    setRefreshing(false);
  }

  // 发送成功后 refreshKey bump → 刷新发送列表（保持当前 tab 不变）
  useEffect(() => {
    startTransition(() => {
      void loadSent();
    });
  }, [refreshKey]);

  function switchTab(next: Tab) {
    if (next === tab) return;
    setTab(next);
    if (next === 'received' && received === null) {
      startTransition(() => {
        void loadReceived();
      });
    }
  }

  function refreshCurrent() {
    startTransition(() => {
      void (tab === 'sent' ? loadSent() : loadReceived());
    });
  }

  // 点 subject → 开 modal 并按 id 懒拉正文。回填时校验 kind+id 仍匹配，
  // 防止「快速切换 / 关闭后旧响应回来」污染当前 modal。
  async function openBody(kind: Tab, id: string) {
    setModal({ open: true, kind, id, loading: true, error: null, body: null });
    const res = await getEmailBodyAction({ kind, id });
    setModal((prev) => {
      if (!prev.open || prev.kind !== kind || prev.id !== id) return prev;
      return res.ok
        ? { open: true, kind, id, loading: false, error: null, body: res.body }
        : { open: true, kind, id, loading: false, error: res.error, body: null };
    });
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => switchTab(t)}
      className={`rounded px-3 py-1 transition-colors ${
        tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="mt-5 rounded-md border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {tab === 'sent' ? 'Send history' : 'Receive history'}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {tab === 'sent'
              ? 'Latest 100 emails sent from Resend for this workspace.'
              : 'Latest 100 emails received via Resend Inbound. Click a subject to read the body.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Email history direction" className="inline-flex rounded-md border border-gray-300 bg-gray-50 p-0.5 text-sm">
            {tabBtn('sent', 'Send history')}
            {tabBtn('received', 'Receive history')}
          </div>
          <button
            type="button"
            onClick={refreshCurrent}
            disabled={refreshing}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {tab === 'sent'
        ? renderSentTable(sent, (id) => openBody('sent', id))
        : renderReceivedTable(received, (id) => openBody('received', id))}

      {modal.open && (
        <EmailBodyModal
          loading={modal.loading}
          error={modal.error}
          body={modal.body}
          onClose={() => setModal({ open: false })}
        />
      )}
    </section>
  );
}

function EmptyOrState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
      {children}
    </div>
  );
}

function MoreFooter() {
  return (
    <div className="border-t border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
      Resend has more records than shown here. This panel currently displays the latest 100.
    </div>
  );
}

function renderSentTable(result: SentResult, onOpen: (id: string) => void) {
  if (result.kind === 'loading') return <EmptyOrState>Loading send history…</EmptyOrState>;
  if (result.kind === 'error') return <AlertBanner variant="error" className="mt-3">{result.error}</AlertBanner>;
  if (result.emails.length === 0) return <EmptyOrState>No emails found in Resend yet.</EmptyOrState>;

  return (
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
                <SubjectButton subject={email.subject} onClick={() => onOpen(email.id)} />
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
      {result.hasMore && <MoreFooter />}
    </div>
  );
}

function renderReceivedTable(result: ReceivedResult | null, onOpen: (id: string) => void) {
  if (result === null || result.kind === 'loading') return <EmptyOrState>Loading receive history…</EmptyOrState>;
  if (result.kind === 'error') return <AlertBanner variant="error" className="mt-3">{result.error}</AlertBanner>;
  if (result.emails.length === 0) return <EmptyOrState>No inbound emails received yet.</EmptyOrState>;

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
      <table className="w-full table-fixed divide-y divide-gray-200 text-xs">
        <colgroup>
          <col className="w-[8.5rem]" />
          <col />
          <col className="w-[18rem]" />
          <col className="w-[6rem]" />
        </colgroup>
        <thead className="bg-gray-50">
          <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
            <th className="px-3 py-2.5 font-medium">Received</th>
            <th className="px-3 py-2.5 font-medium">Message</th>
            <th className="px-3 py-2.5 font-medium">To</th>
            <th className="px-3 py-2.5 font-medium">Files</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {result.emails.map((email) => (
            <tr key={email.id} className="align-top">
              <td className="px-3 py-2.5 text-gray-600">
                <div className="whitespace-nowrap">{formatDate(email.createdAt)}</div>
              </td>
              <td className="px-3 py-2.5">
                <SubjectButton subject={email.subject} onClick={() => onOpen(email.id)} />
                <p className="mt-1 truncate text-[11px] text-gray-500" title={email.from}>
                  From: {email.from}
                </p>
              </td>
              <td className="px-3 py-2.5 text-gray-600">
                {email.to.length === 0 ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  <ul className="max-h-32 space-y-0.5 overflow-y-auto pr-1">
                    {email.to.map((addr, idx) => (
                      <li key={`${addr}-${idx}`} className="break-all">{addr}</li>
                    ))}
                  </ul>
                )}
                {email.cc.length > 0 && (
                  <p className="mt-1 break-all text-[11px] text-gray-500" title={joinAddresses(email.cc)}>
                    Cc: {joinAddresses(email.cc)}
                  </p>
                )}
              </td>
              <td className="px-3 py-2.5 text-gray-600">
                {email.attachmentCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                    📎 {email.attachmentCount}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {result.hasMore && <MoreFooter />}
    </div>
  );
}
