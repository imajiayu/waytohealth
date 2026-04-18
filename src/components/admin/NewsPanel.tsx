'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';
import { type NewsItem } from '@/data/news';
import {
  cleanupBlobAction,
  deleteNewsAction,
  listNewsAction,
  publishNewsAction,
  type PublishInput,
} from '@/app/actions/news';
import { useAdminAuth } from './AdminAuthContext';
import NewsCard from '@/components/news/NewsCard';
import { type Locale } from '@/i18n/config';

type View = 'dashboard' | 'composing';
const MAX_IMAGES_HARD = 30;

interface ImageDraft {
  id: string;
  name: string;
  file: File;         // 原始文件，发布时才上传到 Blob
  previewUrl: string; // URL.createObjectURL(file) — 本地预览
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewsPanel() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {view === 'dashboard' ? 'News' : 'New post'}
        </h1>
        {view === 'dashboard' && (
          <button
            type="button"
            onClick={() => setView('composing')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New post
          </button>
        )}
      </div>

      {view === 'dashboard' && <Dashboard />}
      {view === 'composing' && (
        <Composer onDone={() => setView('dashboard')} onCancel={() => setView('dashboard')} />
      )}
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────────── */

function Dashboard() {
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

/* ── Composer ──────────────────────────────────────────────────────── */

function Composer({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { pw } = useAdminAuth();
  const [publishedAt, setPublishedAt] = useState(toLocalInputValue(new Date()));
  const [titleUa, setTitleUa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyUa, setBodyUa] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<Locale>('ua');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Composer 卸载时释放所有残留 ObjectURL（Cancel 路径）
  const imagesRef = useRef<ImageDraft[]>([]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const available = MAX_IMAGES_HARD - images.length;
    const incoming = Array.from(files).slice(0, available);
    if (files.length > available) {
      setError(`Maximum ${MAX_IMAGES_HARD} images per post; extras ignored.`);
    }

    const drafts: ImageDraft[] = incoming.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((cur) => [...cur, ...drafts]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(id: string) {
    setImages((cur) => {
      const target = cur.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return cur.filter((img) => img.id !== id);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);

    const uploadedUrls: string[] = [];

    try {
      // 1. 并行上传所有图到 Blob
      if (images.length > 0) {
        setUploadProgress({ current: 0, total: images.length });
        let completed = 0;
        const results = await Promise.allSettled(
          images.map(async (img) => {
            const blob = await upload(`news/${img.name}`, img.file, {
              access: 'public',
              handleUploadUrl: '/api/news/upload',
              clientPayload: pw,
            });
            completed++;
            setUploadProgress({ current: completed, total: images.length });
            return blob.url;
          })
        );

        for (const r of results) {
          if (r.status === 'fulfilled') uploadedUrls.push(r.value);
        }

        const firstFail = results.find((r) => r.status === 'rejected');
        if (firstFail) {
          // 回滚已上传的图
          if (uploadedUrls.length > 0) {
            await cleanupBlobAction(pw, uploadedUrls).catch(() => {});
          }
          const reason = (firstFail as PromiseRejectedResult).reason;
          setError(`Upload failed: ${reason instanceof Error ? reason.message : 'unknown'}`);
          return;
        }
      }

      // 2. 提交 JSON
      const input: PublishInput = {
        published_at: new Date(publishedAt).toISOString(),
        title: { ua: titleUa.trim(), en: titleEn.trim() },
        body: { ua: bodyUa.trim(), en: bodyEn.trim() },
        imageUrls: uploadedUrls,
      };
      const res = await publishNewsAction(pw, input);

      if (!res.ok) {
        // publish 失败 → 回滚已上传的图
        if (uploadedUrls.length > 0) {
          await cleanupBlobAction(pw, uploadedUrls).catch(() => {});
        }
        setError(res.error);
        return;
      }

      // 成功：释放 ObjectURL，然后返回 dashboard
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setSuccess(`Published as ${res.id}. Live in ~1 min after Vercel rebuilds.`);
      setTimeout(() => onDone(), 1200);
    } catch (err) {
      if (uploadedUrls.length > 0) {
        await cleanupBlobAction(pw, uploadedUrls).catch(() => {});
      }
      setError(err instanceof Error ? err.message : 'Publish failed.');
    } finally {
      setBusy(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  }
  const inputCls = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700';

  const previewIso = (() => {
    try {
      return new Date(publishedAt).toISOString();
    } catch {
      return new Date().toISOString();
    }
  })();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
    <form onSubmit={handleSubmit} className="space-y-5 rounded-md border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <label className={labelCls}>Publish time</label>
        <input
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Title (UA)</label>
          <input type="text" value={titleUa} onChange={(e) => setTitleUa(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Title (EN)</label>
          <input type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} required className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Body (UA)</label>
        <textarea value={bodyUa} onChange={(e) => setBodyUa(e.target.value)} required rows={5} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Body (EN)</label>
        <textarea value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} required rows={5} className={inputCls} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={labelCls}>
            Images <span className="text-xs font-normal text-gray-400">(uploaded when you publish · front-end shows up to 9 with +N)</span>
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy || images.length >= MAX_IMAGES_HARD}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 disabled:opacity-50"
          >
            + Add images
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {images.map((img, i) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded border border-gray-200 bg-gray-50">
                <Image src={img.previewUrl} alt={img.name} fill sizes="20vw" unoptimized className="object-cover" />
                <div className="pointer-events-none absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {i + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy
            ? uploadProgress.total > 0 && uploadProgress.current < uploadProgress.total
              ? `Uploading ${uploadProgress.current}/${uploadProgress.total}…`
              : 'Publishing…'
            : 'Publish'}
        </button>
      </div>
    </form>

    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Preview</span>
        <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setPreviewLocale('ua')}
            className={`rounded px-2.5 py-1 font-medium transition ${previewLocale === 'ua' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            UA
          </button>
          <button
            type="button"
            onClick={() => setPreviewLocale('en')}
            className={`rounded px-2.5 py-1 font-medium transition ${previewLocale === 'en' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            EN
          </button>
        </div>
      </div>
      <NewsCard
        locale={previewLocale}
        preview
        item={{
          id: 'preview',
          published_at: previewIso,
          title: {
            ua: titleUa || 'Заголовок',
            en: titleEn || 'Title',
          },
          body: {
            ua: bodyUa || 'Текст…',
            en: bodyEn || 'Body…',
          },
          images: images.map((img) => img.previewUrl),
        }}
      />
      <p className="mt-2 text-[11px] text-gray-400">
        This is how the dispatch will appear on <code>/{previewLocale}/news</code>.
      </p>
    </aside>
    </div>
  );
}
