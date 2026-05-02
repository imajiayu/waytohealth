'use client';

import { useEffect, useState } from 'react';
import { type NewsItem } from '@/data/news';
import { deleteNewsAction, listNewsAction } from '@/app/actions/news';
import AlertBanner from '../common/AlertBanner';

interface NewsListProps {
  onEdit?: (item: NewsItem) => void;
}

// admin dashboard：列出所有新闻 + 内联删除/编辑。身份由 server cookie 承载，不需要 pw prop。
export default function NewsList({ onEdit }: NewsListProps = {}) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // cancelled flag + server action 调用；组件卸载后忽略迟到的结果，避免 setState 污染新挂载实例
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listNewsAction();
      if (cancelled) return;
      if (res.ok) setItems(res.items);
      else setError(res.error);
    })();
    return () => { cancelled = true; };
  }, []);

  async function refresh() {
    setError(null);
    const res = await listNewsAction();
    if (res.ok) setItems(res.items);
    else setError(res.error);
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete ${id}?`)) return;
    setDeletingId(id);
    const res = await deleteNewsAction(id);
    setDeletingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    refresh();
  }

  return (
    <div>
      {error && (
        <AlertBanner variant="error" className="mb-4">{error}</AlertBanner>
      )}

      {items === null && <p className="text-sm text-gray-500">Loading…</p>}

      {items && items.length === 0 && (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No posts yet.
        </div>
      )}

      {items && items.length > 0 && (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title (EN)</th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">Title (UA)</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Imgs</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-500">
                    {new Date(it.published_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-sm text-gray-900">{it.title.en}</td>
                  <td className="hidden max-w-xs truncate px-4 py-2.5 text-sm text-gray-500 md:table-cell">{it.title.ua}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-500">{it.images?.length ?? 0}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-3">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(it)}
                          disabled={deletingId === it.id}
                          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(it.id)}
                        disabled={deletingId === it.id}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === it.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
