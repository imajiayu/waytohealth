'use client';

import { Fragment, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { listAssistanceRequestsAction } from '@/app/actions/requests';
import type { AssistanceRequestRecord } from '@/data/requests';
import AlertBanner from './common/AlertBanner';

// 后台全英文（不走 i18n），直接内联英文标签避免跨命名空间依赖
const APPLICANT_LABEL = {
  self: 'Self',
  relative: 'Relative / close person',
  representative: 'Representative (volunteer, social worker, etc.)',
} as const;

const ASSISTANCE_LABEL = {
  physical: 'Physical rehabilitation',
  psychological: 'Psychological support',
  medical: 'Medical equipment',
  transport: 'Transport / transfer',
  other: 'Other',
} as const;

const REFERRAL_LABEL = {
  social: 'Social media',
  google: 'Google search',
  acquaintance: 'Friends / relatives',
  media: 'Media (news, TV)',
  events: 'Public events',
  other: 'Other',
} as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AssistanceRequestsPanel() {
  const [items, setItems] = useState<AssistanceRequestRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listAssistanceRequestsAction();
      if (cancelled) return;
      if (res.ok) setItems(res.items);
      else setError(res.error);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assistance requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Read-only log of submissions from /request-assistance.
          </p>
        </div>
        {items && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {items.length} {items.length === 1 ? 'record' : 'records'}
          </span>
        )}
      </div>

      {error && (
        <AlertBanner variant="error" className="mb-4">{error}</AlertBanner>
      )}

      {items === null && !error && <p className="text-sm text-gray-500">Loading…</p>}

      {items && items.length === 0 && (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No submissions yet.
        </div>
      )}

      {items && items.length > 0 && (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-2 py-2"></th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                  City
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                  Type
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                  Email
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                  Phone
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Locale
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((it) => {
                const open = expanded === it.id;
                return (
                  <Fragment key={it.id}>
                    <tr
                      onClick={() => setExpanded(open ? null : it.id)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-2 py-2.5 text-gray-400">
                        {open ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-500">
                        {formatDate(it.submitted_at)}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900">{it.data.fullName}</td>
                      <td className="hidden px-4 py-2.5 text-sm text-gray-700 md:table-cell">
                        {it.data.city}
                      </td>
                      <td className="hidden px-4 py-2.5 text-sm text-gray-700 md:table-cell">
                        {ASSISTANCE_LABEL[it.data.assistance]}
                      </td>
                      <td className="hidden px-4 py-2.5 text-sm text-gray-700 lg:table-cell">
                        {it.data.email}
                      </td>
                      <td className="hidden px-4 py-2.5 text-sm text-gray-700 lg:table-cell">
                        {it.data.phone}
                      </td>
                      <td className="px-4 py-2.5 text-xs uppercase text-gray-500">{it.locale}</td>
                    </tr>
                    {open && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                            <DetailRow label="ID" value={it.id} mono />
                            <DetailRow label="Submitted at" value={formatDate(it.submitted_at)} />
                            <DetailRow label="Email" value={it.data.email} />
                            <DetailRow label="Full name" value={it.data.fullName} />
                            <DetailRow label="Phone" value={it.data.phone} />
                            <DetailRow label="City" value={it.data.city} />
                            <DetailRow
                              label="Applicant"
                              value={APPLICANT_LABEL[it.data.applicant]}
                            />
                            <DetailRow
                              label="Assistance needed"
                              value={ASSISTANCE_LABEL[it.data.assistance]}
                            />
                            <DetailRow
                              label="Referral source"
                              value={REFERRAL_LABEL[it.data.referral]}
                            />
                            <DetailRow
                              label="Consent"
                              value={it.data.consent ? 'Given' : 'Missing'}
                            />
                            <div className="sm:col-span-2">
                              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                Description
                              </dt>
                              <dd className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-gray-900">
                                {it.data.description}
                              </dd>
                            </div>
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className={`mt-0.5 text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
