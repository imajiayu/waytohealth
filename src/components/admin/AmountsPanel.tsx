'use client';

import { useMemo, useState } from 'react';
import AlertBanner from './common/AlertBanner';
import { saveProjectAmountsAction, type AmountUpdate } from '@/app/actions/projectAmounts';

export interface AmountRow {
  id: number;
  title: string;
  goal: number | null;
  currency: string;
  raised: number;
  updatedAt: string | null;
}

interface Props {
  initial: AmountRow[];
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'success'; saved: number }
  | { kind: 'error'; error: string };

function formatUah(n: number): string {
  return n.toLocaleString('en-US');
}

function formatUpdated(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  // YYYY-MM-DD HH:mm UTC：admin 后台同事不分时区跨地区协作，统一 UTC 减少混淆
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

export default function AmountsPanel({ initial }: Props) {
  // 用字符串管理 input value 以保留空串状态；提交时解析回数字
  const [drafts, setDrafts] = useState<Record<number, string>>(() =>
    Object.fromEntries(initial.map((r) => [r.id, String(r.raised)])),
  );
  const [savedAt, setSavedAt] = useState<Record<number, string>>(() =>
    Object.fromEntries(initial.map((r) => [r.id, r.updatedAt ?? ''])),
  );
  const [committed, setCommitted] = useState<Record<number, number>>(() =>
    Object.fromEntries(initial.map((r) => [r.id, r.raised])),
  );
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // 哪些行被改了（值不同 + 解析得出合法非负整数）
  const dirty = useMemo(() => {
    const out: AmountUpdate[] = [];
    for (const r of initial) {
      const raw = drafts[r.id]?.trim() ?? '';
      if (raw === '') continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) continue;
      const intN = Math.floor(n);
      if (intN === committed[r.id]) continue;
      out.push({ projectId: r.id, raisedUah: intN });
    }
    return out;
  }, [drafts, committed, initial]);

  const anyInvalid = useMemo(
    () =>
      initial.some((r) => {
        const raw = drafts[r.id]?.trim() ?? '';
        if (raw === '') return true; // 空串不允许提交
        const n = Number(raw);
        return !Number.isFinite(n) || n < 0;
      }),
    [drafts, initial],
  );

  async function handleSave() {
    if (dirty.length === 0) return;
    setStatus({ kind: 'saving' });
    const res = await saveProjectAmountsAction(dirty);
    if (!res.ok) {
      setStatus({ kind: 'error', error: res.error });
      return;
    }
    // 写入本地 committed / savedAt，下一次 dirty 计算就把这些行视作未改
    const now = new Date().toISOString();
    setCommitted((prev) => {
      const next = { ...prev };
      for (const u of dirty) next[u.projectId] = u.raisedUah;
      return next;
    });
    setSavedAt((prev) => {
      const next = { ...prev };
      for (const u of dirty) next[u.projectId] = now;
      return next;
    });
    setStatus({ kind: 'success', saved: res.saved });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Amounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manually maintained raised totals (monobank jars + Stripe). Update whenever you reconcile
          donation channels — the homepage and project pages refresh within 60 seconds.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"
      >
        <table className="w-full table-auto text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3 text-right">Goal</th>
              <th className="px-4 py-3 text-right">Raised (UAH)</th>
              <th className="px-4 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {initial.map((r) => {
              const raw = drafts[r.id] ?? '';
              const trimmed = raw.trim();
              const n = trimmed === '' ? NaN : Number(trimmed);
              const invalid = !Number.isFinite(n) || n < 0 || trimmed === '';
              const changed = !invalid && Math.floor(n) !== committed[r.id];
              return (
                <tr key={r.id} className={changed ? 'bg-amber-50/40' : ''}>
                  <td className="px-4 py-3 text-gray-500">{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.title}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500">
                    {r.goal == null ? '—' : `${formatUah(r.goal)} ${r.currency}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={raw}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      aria-label={`Raised amount for project ${r.id}`}
                      className={`w-32 rounded-md border px-3 py-1.5 text-right font-mono text-sm outline-none focus:ring-1 ${
                        invalid
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : changed
                            ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatUpdated(savedAt[r.id] || null)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </form>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="text-xs text-gray-500">
          {dirty.length === 0
            ? 'No changes'
            : `${dirty.length} row${dirty.length === 1 ? '' : 's'} pending`}
        </div>
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={status.kind === 'saving' || dirty.length === 0 || anyInvalid}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status.kind === 'saving' ? 'Saving…' : `Save ${dirty.length || ''}`.trim()}
        </button>
      </div>

      {status.kind === 'error' && (
        <AlertBanner variant="error" className="mt-4">
          {status.error}
        </AlertBanner>
      )}
      {status.kind === 'success' && (
        <AlertBanner variant="success" className="mt-4">
          Saved {status.saved} row{status.saved === 1 ? '' : 's'}.
        </AlertBanner>
      )}
    </div>
  );
}
