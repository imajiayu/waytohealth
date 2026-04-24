'use client';

import { Fragment, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { listPartnershipRequestsAction } from '@/app/actions/requests';
import type { PartnershipRequestRecord } from '@/data/requests';

const ORG_LABEL = {
  business: 'Business / company',
  charity: 'Charity / foundation',
  international: 'International organization',
  government: 'Government institution',
  volunteer: 'Initiative group / volunteers',
  other: 'Other',
} as const;

const SUPPORT_LABEL = {
  financial: 'Financial support',
  'joint-projects': 'Joint projects',
  information: 'Information support',
  goods: 'Goods / equipment',
  services: 'Services (pro bono)',
  other: 'Other',
} as const;

const INTEREST_LABEL = {
  inpatient: 'Inpatient department',
  physical: 'Physical rehabilitation',
  psychological: 'Psychological support',
  humanitarian: 'Humanitarian aid',
  innovation: 'Innovative solutions',
  equipment: 'Medical equipment',
  transport: 'Specialized transport',
  other: 'Other',
} as const;

const REFERRAL_LABEL = {
  social: 'Social media',
  google: 'Google search',
  colleagues: 'Colleagues',
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

export default function PartnershipRequestsPanel() {
  const [items, setItems] = useState<PartnershipRequestRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listPartnershipRequestsAction();
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
          <h1 className="text-2xl font-bold text-gray-900">Partnership requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Read-only log of submissions from /partnership.
          </p>
        </div>
        {items && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {items.length} {items.length === 1 ? 'record' : 'records'}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
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
                  Organization
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                  Contact
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                  Type
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                  Email
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                  Location
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
                      <td className="px-4 py-2.5 text-sm text-gray-900">{it.data.orgName}</td>
                      <td className="hidden px-4 py-2.5 text-sm text-gray-700 md:table-cell">
                        {it.data.contactName}
                      </td>
                      <td className="hidden px-4 py-2.5 text-sm text-gray-700 md:table-cell">
                        {ORG_LABEL[it.data.orgType]}
                      </td>
                      <td className="hidden px-4 py-2.5 text-sm text-gray-700 lg:table-cell">
                        {it.data.email}
                      </td>
                      <td className="hidden px-4 py-2.5 text-sm text-gray-700 lg:table-cell">
                        {it.data.location}
                      </td>
                      <td className="px-4 py-2.5 text-xs uppercase text-gray-500">{it.locale}</td>
                    </tr>
                    {open && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                            <DetailRow label="ID" value={it.id} mono />
                            <DetailRow label="Submitted at" value={formatDate(it.submitted_at)} />
                            <DetailRow label="Organization" value={it.data.orgName} />
                            <DetailRow label="Contact name" value={it.data.contactName} />
                            <DetailRow label="Position" value={it.data.position} />
                            <DetailRow label="Phone" value={it.data.phone} />
                            <DetailRow label="Email" value={it.data.email} />
                            <DetailRow label="Location" value={it.data.location} />
                            <DetailRow
                              label="Organization type"
                              value={ORG_LABEL[it.data.orgType]}
                            />
                            <DetailRow
                              label="Support way"
                              value={SUPPORT_LABEL[it.data.supportWay]}
                            />
                            <DetailRow
                              label="Has idea"
                              value={it.data.hasIdea === 'yes' ? 'Yes' : 'No'}
                            />
                            <DetailRow
                              label="Referral source"
                              value={REFERRAL_LABEL[it.data.referral]}
                            />
                            <div className="sm:col-span-2">
                              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                Website / socials
                              </dt>
                              <dd className="mt-0.5 break-all text-gray-900">{it.data.website}</dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                Interests
                              </dt>
                              <dd className="mt-1 flex flex-wrap gap-1.5">
                                {it.data.interests.map((v) => (
                                  <span
                                    key={v}
                                    className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                                  >
                                    {INTEREST_LABEL[v]}
                                  </span>
                                ))}
                              </dd>
                            </div>
                            {it.data.ideaDescription && (
                              <div className="sm:col-span-2">
                                <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                  Cooperation idea
                                </dt>
                                <dd className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-gray-900">
                                  {it.data.ideaDescription}
                                </dd>
                              </div>
                            )}
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
