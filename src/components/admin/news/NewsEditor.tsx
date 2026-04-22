'use client';

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import {
  cleanupBlobAction,
  publishNewsAction,
  type PublishInput,
} from '@/app/actions/news';
import NewsCard from '@/components/news/NewsCard';
import { type Locale } from '@/i18n/config';
import { type Tag } from '@/data/news';
import ImageUploader from './ImageUploader';
import TagInput from './TagInput';
import { type ImageDraft, MAX_IMAGES_HARD } from './types';

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface NewsEditorProps {
  onDone: () => void;
  onCancel: () => void;
}

export default function NewsEditor({ onDone, onCancel }: NewsEditorProps) {
  const [publishedAt, setPublishedAt] = useState(toLocalInputValue(new Date()));
  const [titleUa, setTitleUa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyUa, setBodyUa] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<Locale>('ua');

  // 卸载时释放所有残留 ObjectURL（Cancel 路径）
  const imagesRef = useRef<ImageDraft[]>([]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  // 成功后延迟跳转；组件卸载必须清掉 timeout 否则会 setState on dead tree
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
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

    // 提交前校验发布时间；datetime-local 可能被清空导致 new Date('') → Invalid Date
    const publishedDate = new Date(publishedAt);
    if (!Number.isFinite(publishedDate.getTime())) {
      setError('Invalid publish time. Please pick a valid date/time.');
      return;
    }

    setBusy(true);

    const uploadedUrls: string[] = [];

    try {
      // 1. 并行上传所有图到 Blob（身份由 cookie 承载，upload route 自己读 session）
      if (images.length > 0) {
        setUploadProgress({ current: 0, total: images.length });
        let completed = 0;
        const results = await Promise.allSettled(
          images.map(async (img) => {
            const blob = await upload(`news/${img.name}`, img.file, {
              access: 'public',
              handleUploadUrl: '/api/news/upload',
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
          if (uploadedUrls.length > 0) {
            await cleanupBlobAction(uploadedUrls).catch(() => {});
          }
          const reason = (firstFail as PromiseRejectedResult).reason;
          setError(`Upload failed: ${reason instanceof Error ? reason.message : 'unknown'}`);
          return;
        }
      }

      // 2. 提交 JSON
      const input: PublishInput = {
        published_at: publishedDate.toISOString(),
        title: { ua: titleUa.trim(), en: titleEn.trim() },
        body: { ua: bodyUa.trim(), en: bodyEn.trim() },
        imageUrls: uploadedUrls,
        tags,
      };
      const res = await publishNewsAction(input);

      if (!res.ok) {
        if (uploadedUrls.length > 0) {
          await cleanupBlobAction(uploadedUrls).catch(() => {});
        }
        setError(res.error);
        return;
      }

      // 成功：释放 ObjectURL，返回 dashboard
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setSuccess(`Published as ${res.id}.`);
      doneTimeoutRef.current = setTimeout(() => onDone(), 1200);
    } catch (err) {
      if (uploadedUrls.length > 0) {
        await cleanupBlobAction(uploadedUrls).catch(() => {});
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
    const d = new Date(publishedAt);
    return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
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

        <TagInput value={tags} onChange={setTags} disabled={busy} />

        <ImageUploader
          images={images}
          onFilesSelected={handleFilesSelected}
          onRemove={removeImage}
          disabled={busy}
        />

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
            ...(tags.length > 0 ? { tags } : {}),
          }}
        />
        <p className="mt-2 text-[11px] text-gray-400">
          This is how the dispatch will appear on <code>/{previewLocale}/news</code>.
        </p>
      </aside>
    </div>
  );
}
