'use client';

import { useEffect, useState } from 'react';
import { type NewsItem } from '@/data/news';
import { deleteNewsAction, listNewsAction } from '@/app/actions/news';
import { useAdminAuth } from '../AdminAuthContext';

// admin dashboard：列出所有新闻 + 内联删除
export default function NewsList() {
  const { pw } = useAdminAuth();
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const res = await listNewsAction(pw);
    if (res.ok) setItems(res.items);
    else setError(res.error);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (!confirm(`Delete ${id}?`)) return;
    setDeletingId(id);
    const res = await deleteNewsAction(pw, id);
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
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
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
                    <button
                      type="button"
                      onClick={() => handleDelete(it.id)}
                      disabled={deletingId === it.id}
                      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deletingId === it.id ? 'Deleting…' : 'Delete'}
                    </button>
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
