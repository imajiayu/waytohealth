'use client';

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import {
  listTemplatesAction,
  getTemplateAction,
  createOrUpdateTemplateAction,
  deleteTemplateAction,
} from '@/app/actions/emailTemplates';
import type { EmailLocale, EmailTemplateMeta } from '@/lib/emailTemplatesStore';
import AlertBanner from '../common/AlertBanner';

// 一个模板 = Blob 文件夹 email-templates/<slug>/。admin 上传图片拿 URL → 写进本地 HTML 的
// <img src> → 上传 .html 文件 → 填元数据保存（server 端写 meta.json）。

const LOCALES: EmailLocale[] = ['ua', 'en'];

// 从 name 派生 path-safe 的 Blob 文件夹名（如 "Partnership invite (UA)" → "partnership-invite-ua"）。
// 满足 SLUG_RE `^[a-z0-9][a-z0-9-]{0,63}$`；纯非拉丁字符（如全乌克兰语）会得到空串，调用方需校验。
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // 非字母数字（含空格/括号/Unicode）→ 连字符
    .replace(/^-+|-+$/g, '') // 去首尾连字符
    .slice(0, 64)
    .replace(/-+$/g, ''); // slice 可能切在连字符上，再清一次
}

interface BlobFile {
  url: string;
  name: string;
}

type View = { kind: 'list' } | { kind: 'form'; editingSlug: string | null };

export default function TemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplateMeta[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: 'list' });

  // 事件处理器复用（保存 / 删除后刷新）—— 在 effect 外调用，不触发级联渲染告警
  async function loadList() {
    const res = await listTemplatesAction();
    if (!res.ok) {
      setLoadError(res.error);
      return;
    }
    setLoadError(null);
    setTemplates(res.templates);
  }

  // 首次加载：内联 async IIFE（setState 在 await 之后），避免 set-state-in-effect 告警
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listTemplatesAction();
      if (cancelled) return;
      if (!res.ok) {
        setLoadError(res.error);
        return;
      }
      setLoadError(null);
      setTemplates(res.templates);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return <AlertBanner variant="error">{loadError}</AlertBanner>;
  }
  if (templates === null) {
    return <p className="text-sm text-gray-500">Loading templates…</p>;
  }

  if (view.kind === 'form') {
    return (
      <TemplateForm
        editingSlug={view.editingSlug}
        existingIds={templates.map((t) => t.id)}
        onCancel={() => setView({ kind: 'list' })}
        onSaved={async () => {
          await loadList();
          setView({ kind: 'list' });
        }}
      />
    );
  }

  return (
    <TemplateList
      templates={templates}
      onNew={() => setView({ kind: 'form', editingSlug: null })}
      onEdit={(slug) => setView({ kind: 'form', editingSlug: slug })}
      onDeleted={loadList}
    />
  );
}

// —— 列表视图 ——

function TemplateList({
  templates,
  onNew,
  onEdit,
  onDeleted,
}: {
  templates: EmailTemplateMeta[];
  onNew: () => void;
  onEdit: (slug: string) => void;
  onDeleted: () => Promise<void>;
}) {
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(slug: string) {
    if (!window.confirm(`Delete template "${slug}"? This removes all its files from Blob.`)) return;
    setBusySlug(slug);
    setError(null);
    const res = await deleteTemplateAction(slug);
    setBusySlug(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await onDeleted();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Each template is a Blob folder. Upload images, reference their URLs in your HTML, then upload the HTML.
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New template
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <AlertBanner variant="error">{error}</AlertBanner>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No templates yet. Create one to get started.
        </p>
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li
              key={t.id}
              className="flex items-start justify-between gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{t.name}</span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gray-500">
                    {t.locales.join(' / ')}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-gray-400" title={t.subject}>
                  Subject: {t.subject}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(t.id)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  disabled={busySlug === t.id}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:border-red-300 disabled:opacity-50"
                >
                  {busySlug === t.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// —— 新建 / 编辑表单 ——

function TemplateForm({
  editingSlug,
  existingIds,
  onCancel,
  onSaved,
}: {
  editingSlug: string | null;
  existingIds: string[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const isEditing = editingSlug !== null;
  // 文件夹 slug 从 name 派生；首次上传 / 保存时锁定（committedSlug），之后改 name 不动已传文件的归属。
  // 编辑态直接沿用现有 slug（文件夹不重命名，name 仅作展示）。
  const [committedSlug, setCommittedSlug] = useState<string | null>(editingSlug);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [locales, setLocales] = useState<Set<EmailLocale>>(new Set(['ua']));
  const [assets, setAssets] = useState<BlobFile[]>([]);
  const [htmlFile, setHtmlFile] = useState<BlobFile | null>(null);
  const [textFile, setTextFile] = useState<BlobFile | null>(null);

  const [loading, setLoading] = useState(isEditing);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // 编辑：回填现有 meta
  useEffect(() => {
    if (!editingSlug) return;
    let cancelled = false;
    (async () => {
      const res = await getTemplateAction(editingSlug);
      if (cancelled) return;
      if (!res.ok || !res.meta) {
        setError(res.ok ? 'Template not found' : res.error);
        setLoading(false);
        return;
      }
      const m = res.meta;
      setName(m.name);
      setSubject(m.subject);
      setLocales(new Set(m.locales.length > 0 ? m.locales : ['ua']));
      setHtmlFile({ url: m.htmlUrl, name: fileNameFromUrl(m.htmlUrl) });
      setTextFile(m.textUrl ? { url: m.textUrl, name: fileNameFromUrl(m.textUrl) } : null);
      setAssets((m.assetUrls ?? []).map((u) => ({ url: u, name: fileNameFromUrl(u) })));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [editingSlug]);

  // name 派生出的文件夹 slug（未锁定前的预览值）；锁定后以 committedSlug 为准
  const derivedSlug = slugify(name);
  const effectiveSlug = committedSlug ?? (derivedSlug || null);
  const canUpload = !!effectiveSlug;

  // 拿到（必要时锁定）本模板的文件夹 slug；name 派生不出合法 slug 或与现有模板重名则报错返回 null
  function ensureSlug(): string | null {
    if (committedSlug) return committedSlug;
    const s = slugify(name);
    if (!s) {
      setError('Template name must contain at least one Latin letter or digit');
      return null;
    }
    if (existingIds.includes(s)) {
      setError(`A template named “${name.trim()}” already exists`);
      return null;
    }
    setCommittedSlug(s);
    return s;
  }

  async function uploadInto(file: File, contentType: string): Promise<BlobFile | null> {
    const slug = ensureSlug();
    if (!slug) return null;
    setError(null);
    setUploading(true);
    try {
      const blob = await upload(`email-templates/${slug}/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/email/upload',
        contentType,
      });
      return { url: blob.url, name: file.name };
    } catch {
      setError(`Upload failed: ${file.name}`);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleAssetFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const res = await uploadInto(file, file.type || 'application/octet-stream');
      if (res) setAssets((prev) => [...prev, res]);
    }
  }

  async function handleHtmlFile(file: File | undefined) {
    if (!file) return;
    const res = await uploadInto(file, 'text/html');
    if (res) {
      setHtmlFile(res);
      setPreviewHtml(null);
    }
  }

  async function handleTextFile(file: File | undefined) {
    if (!file) return;
    const res = await uploadInto(file, 'text/plain');
    if (res) setTextFile(res);
  }

  function toggleLocale(l: EmailLocale) {
    setLocales((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }

  async function loadPreview() {
    if (!htmlFile) return;
    setError(null);
    try {
      const res = await fetch(htmlFile.url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      setPreviewHtml(await res.text());
    } catch {
      setError('Could not load HTML preview');
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const slug = ensureSlug();
    if (!slug) return;
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (locales.size === 0) {
      setError('Pick at least one language');
      return;
    }
    if (!htmlFile) {
      setError('Upload an HTML body file');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await createOrUpdateTemplateAction({
      slug,
      name: name.trim(),
      locales: Array.from(locales),
      subject: subject.trim(),
      htmlUrl: htmlFile.url,
      textUrl: textFile?.url,
      assetUrls: assets.map((a) => a.url),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await onSaved();
  }

  const inputCls =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700';

  if (loading) {
    return <p className="text-sm text-gray-500">Loading template…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? `Edit template` : 'New template'}
        </h1>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to list
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-md border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <label htmlFor="tpl-name" className={labelCls}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="tpl-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Partnership invite (UA)"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-gray-400">
              Shown in the template dropdown when sending.
              {effectiveSlug ? (
                <>
                  {' '}Blob folder: <code className="text-gray-500">{effectiveSlug}</code>
                  {committedSlug && !isEditing ? ' (locked)' : ''}
                </>
              ) : (
                ' Enter a name with Latin letters/digits to start uploading files.'
              )}
            </p>
          </div>

          <div>
            <label htmlFor="tpl-subject" className={labelCls}>
              Default subject <span className="text-red-500">*</span>
            </label>
            <input
              id="tpl-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject (pre-filled when picked)"
              className={inputCls}
            />
          </div>

          <div>
            <span className={labelCls}>Languages</span>
            <div className="mt-1 flex gap-4">
              {LOCALES.map((l) => (
                <label key={l} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={locales.has(l)}
                    onChange={() => toggleLocale(l)}
                    className="rounded border-gray-300"
                  />
                  <span className="uppercase">{l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 资源上传：先传图，拿到 URL 写进本地 HTML 的 img src */}
          <div className="border-t border-gray-100 pt-4">
            <FilePickerRow
              label="Images / assets"
              hint="Upload images first, copy each URL into your HTML's <img src>."
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              disabled={uploading || !canUpload}
              onFiles={handleAssetFiles}
            />
            {assets.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {assets.map((a) => (
                  <li key={a.url} className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-gray-800" title={a.name}>
                        {a.name}
                      </span>
                      <CopyButton text={a.url} />
                      <button
                        type="button"
                        onClick={() => setAssets((prev) => prev.filter((x) => x.url !== a.url))}
                        className="shrink-0 text-xs text-red-600 hover:text-red-700"
                      >
                        remove
                      </button>
                    </div>
                    <p className="mt-1 break-all font-mono text-[11px] text-gray-400">{a.url}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* HTML 正文 + 纯文本 fallback */}
          <div className="border-t border-gray-100 pt-4">
            <FilePickerRow
              label="HTML body *"
              hint="Upload the .html file (referencing the asset URLs above)."
              accept=".html,text/html"
              disabled={uploading || !canUpload}
              onFiles={(f) => handleHtmlFile(f?.[0])}
            />
            {htmlFile && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-gray-800">{htmlFile.name}</span>
                <button type="button" onClick={loadPreview} className="shrink-0 text-xs text-blue-600 hover:text-blue-700">
                  preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHtmlFile(null);
                    setPreviewHtml(null);
                  }}
                  className="shrink-0 text-xs text-red-600 hover:text-red-700"
                >
                  remove
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <FilePickerRow
              label="Plain-text fallback"
              hint="Optional .txt shown when the client can't render HTML."
              accept=".txt,text/plain"
              disabled={uploading || !canUpload}
              onFiles={(f) => handleTextFile(f?.[0])}
            />
            {textFile && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-gray-800">{textFile.name}</span>
                <button
                  type="button"
                  onClick={() => setTextFile(null)}
                  className="shrink-0 text-xs text-red-600 hover:text-red-700"
                >
                  remove
                </button>
              </div>
            )}
          </div>

          {error && <AlertBanner variant="error">{error}</AlertBanner>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-gray-400">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || uploading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save template'}
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <span className="mb-3 block text-xs font-medium uppercase tracking-wider text-gray-400">Preview</span>
          {previewHtml ? (
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
              <iframe
                title="Template preview"
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                className="h-[640px] w-full border-0"
              />
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              Upload an HTML file and click “preview”.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// —— 小组件 ——

function FilePickerRow({
  label,
  hint,
  accept,
  multiple,
  disabled,
  onFiles,
}: {
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={disabled}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 disabled:opacity-50"
        >
          + Upload
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
      <input
        ref={ref}
        type="file"
        aria-label={label}
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          onFiles(e.target.files);
          if (ref.current) ref.current.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard 不可用时静默 */
        }
      }}
      className="shrink-0 text-xs text-blue-600 hover:text-blue-700"
    >
      {copied ? 'copied!' : 'copy URL'}
    </button>
  );
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1)) || url;
  } catch {
    return url;
  }
}
