'use client';

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import {
  cleanupBlobAction,
  publishNewsAction,
  updateNewsAction,
  type PublishInput,
  type UpdateInput,
} from '@/app/actions/news';
import NewsCard from '@/components/news/NewsCard';
import { type Locale } from '@/i18n/config';
import { type NewsItem, type Tag } from '@/data/news';
import ImageUploader from './ImageUploader';
import TagInput from './TagInput';
import { type ImageDraft, MAX_IMAGES_HARD } from './types';
import { transcodeToWebp } from './imageTransform';

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type NewsEditorProps =
  | {
      mode?: 'create';
      initialItem?: undefined;
      onDone: () => void;
      onCancel: () => void;
    }
  | {
      mode: 'edit';
      initialItem: NewsItem;
      onDone: () => void;
      onCancel: () => void;
    };

export default function NewsEditor(props: NewsEditorProps) {
  const mode = props.mode ?? 'create';
  const initial = props.mode === 'edit' ? props.initialItem : null;
  const { onDone, onCancel } = props;

  const [publishedAt, setPublishedAt] = useState(
    initial ? toLocalInputValue(new Date(initial.published_at)) : toLocalInputValue(new Date())
  );
  const [titleUa, setTitleUa] = useState(initial?.title.ua ?? '');
  const [titleEn, setTitleEn] = useState(initial?.title.en ?? '');
  const [bodyUa, setBodyUa] = useState(initial?.body.ua ?? '');
  const [bodyEn, setBodyEn] = useState(initial?.body.en ?? '');
  const [images, setImages] = useState<ImageDraft[]>(() =>
    (initial?.images ?? []).map((url, i) => ({
      kind: 'existing' as const,
      id: `existing-${i}-${url}`,
      url,
    }))
  );
  const [tags, setTags] = useState<Tag[]>(initial?.tags ?? []);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [transcoding, setTranscoding] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<Locale>('ua');

  // 卸载时只释放 'new' draft 的 ObjectURL；existing 的是持久 Blob URL，不能 revoke
  const imagesRef = useRef<ImageDraft[]>([]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  // 给转码异步流程一个 "组件还活着吗" 的信号：转码 promise 完成时若已卸载，
  // 直接 revoke 新创建的 URL，避免它们漏过 imagesRef cleanup
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      imagesRef.current.forEach((img) => {
        if (img.kind === 'new') URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, []);

  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    };
  }, []);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const available = MAX_IMAGES_HARD - images.length;
    const incoming = Array.from(files).slice(0, available);
    const messages: string[] = [];
    if (files.length > available) {
      messages.push(`Maximum ${MAX_IMAGES_HARD} images per post; ${files.length - available} extra ignored.`);
    }
    if (incoming.length === 0) {
      if (messages.length > 0) setError(messages.join('\n'));
      return;
    }

    setTranscoding(true);
    try {
      const results = await Promise.allSettled(incoming.map((file) => transcodeToWebp(file)));
      const drafts: ImageDraft[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const previewUrl = URL.createObjectURL(r.value);
          // 组件已卸载就当场 revoke，否则会成为孤儿 URL —— imagesRef cleanup 已经跑过且不会再更新
          if (!mountedRef.current) {
            URL.revokeObjectURL(previewUrl);
            return;
          }
          drafts.push({
            kind: 'new',
            id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            name: r.value.name,
            file: r.value,
            previewUrl,
          });
        } else {
          const reason = r.reason instanceof Error ? r.reason.message : 'transcode failed';
          messages.push(`${incoming[i].name}: ${reason}`);
        }
      });
      if (!mountedRef.current) return;
      if (drafts.length > 0) setImages((cur) => [...cur, ...drafts]);
      if (messages.length > 0) setError(messages.join('\n'));
    } finally {
      if (mountedRef.current) setTranscoding(false);
    }
  }

  function removeImage(id: string) {
    setImages((cur) => {
      const target = cur.find((img) => img.id === id);
      if (target && target.kind === 'new') URL.revokeObjectURL(target.previewUrl);
      return cur.filter((img) => img.id !== id);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const publishedDate = new Date(publishedAt);
    if (!Number.isFinite(publishedDate.getTime())) {
      setError('Invalid publish time. Please pick a valid date/time.');
      return;
    }

    setBusy(true);

    // 发布失败时只需回滚"本次新传的"图，不能碰原有 existing 的 URL
    const newlyUploadedUrls: string[] = [];
    const urlByDraftId = new Map<string, string>();

    try {
      // 1. 只上传新增的 file draft；existing 的 URL 直接保留
      const newDrafts = images.filter((img): img is Extract<ImageDraft, { kind: 'new' }> => img.kind === 'new');
      if (newDrafts.length > 0) {
        setUploadProgress({ current: 0, total: newDrafts.length });
        let completed = 0;
        const results = await Promise.allSettled(
          newDrafts.map(async (img) => {
            const blob = await upload(`news/${img.name}`, img.file, {
              access: 'public',
              handleUploadUrl: '/api/news/upload',
            });
            completed++;
            setUploadProgress({ current: completed, total: newDrafts.length });
            return { draftId: img.id, url: blob.url };
          })
        );

        for (const r of results) {
          if (r.status === 'fulfilled') {
            urlByDraftId.set(r.value.draftId, r.value.url);
            newlyUploadedUrls.push(r.value.url);
          }
        }

        const firstFail = results.find((r) => r.status === 'rejected');
        if (firstFail) {
          if (newlyUploadedUrls.length > 0) {
            await cleanupBlobAction(newlyUploadedUrls).catch(() => {});
          }
          const reason = (firstFail as PromiseRejectedResult).reason;
          setError(`Upload failed: ${reason instanceof Error ? reason.message : 'unknown'}`);
          return;
        }
      }

      // 按草稿顺序拼最终 imageUrls（existing 原 URL + 新上传的 URL）
      const finalUrls = images
        .map((img) => (img.kind === 'existing' ? img.url : urlByDraftId.get(img.id) ?? ''))
        .filter(Boolean);

      // 2. 调 action
      if (mode === 'edit' && initial) {
        const input: UpdateInput = {
          id: initial.id,
          published_at: publishedDate.toISOString(),
          title: { ua: titleUa.trim(), en: titleEn.trim() },
          body: { ua: bodyUa.trim(), en: bodyEn.trim() },
          imageUrls: finalUrls,
          tags,
        };
        const res = await updateNewsAction(input);
        if (!res.ok) {
          if (newlyUploadedUrls.length > 0) {
            await cleanupBlobAction(newlyUploadedUrls).catch(() => {});
          }
          setError(res.error);
          return;
        }
        // 成功：释放新上传图的 ObjectURL
        images.forEach((img) => {
          if (img.kind === 'new') URL.revokeObjectURL(img.previewUrl);
        });
        setSuccess(`Updated ${initial.id}.`);
        doneTimeoutRef.current = setTimeout(() => onDone(), 1000);
      } else {
        const input: PublishInput = {
          published_at: publishedDate.toISOString(),
          title: { ua: titleUa.trim(), en: titleEn.trim() },
          body: { ua: bodyUa.trim(), en: bodyEn.trim() },
          imageUrls: finalUrls,
          tags,
        };
        const res = await publishNewsAction(input);
        if (!res.ok) {
          if (newlyUploadedUrls.length > 0) {
            await cleanupBlobAction(newlyUploadedUrls).catch(() => {});
          }
          setError(res.error);
          return;
        }
        images.forEach((img) => {
          if (img.kind === 'new') URL.revokeObjectURL(img.previewUrl);
        });
        setSuccess(`Published as ${res.id}.`);
        doneTimeoutRef.current = setTimeout(() => onDone(), 1200);
      }
    } catch (err) {
      if (newlyUploadedUrls.length > 0) {
        await cleanupBlobAction(newlyUploadedUrls).catch(() => {});
      }
      setError(err instanceof Error ? err.message : 'Submit failed.');
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

  const submitLabel = busy
    ? uploadProgress.total > 0 && uploadProgress.current < uploadProgress.total
      ? `Uploading ${uploadProgress.current}/${uploadProgress.total}…`
      : mode === 'edit'
        ? 'Saving…'
        : 'Publishing…'
    : mode === 'edit'
      ? 'Save changes'
      : 'Publish';

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
          <div className="flex items-baseline justify-between gap-2">
            <label className={labelCls}>Body (UA)</label>
            <span className="text-[11px] text-gray-400">URLs starting with http(s):// become clickable links automatically</span>
          </div>
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
          disabled={busy || transcoding}
          transcoding={transcoding}
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
            disabled={busy || transcoding}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitLabel}
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
            id: initial?.id ?? 'preview',
            published_at: previewIso,
            title: {
              ua: titleUa || 'Заголовок',
              en: titleEn || 'Title',
            },
            body: {
              ua: bodyUa || 'Текст…',
              en: bodyEn || 'Body…',
            },
            images: images.map((img) => (img.kind === 'existing' ? img.url : img.previewUrl)),
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
