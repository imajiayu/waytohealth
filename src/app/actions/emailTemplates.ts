'use server';

import { put, del, list } from '@vercel/blob';
import { revalidateTag } from 'next/cache';
import { ensureAdmin } from '@/lib/adminSession';
import { errorMessage } from '@/lib/errors';
import { isBlobUrl } from '@/lib/blobUrl';
import {
  listTemplates,
  renderEmail,
  getTemplateMeta,
  TEMPLATE_PREFIX,
  TEMPLATE_CACHE_TAG,
  type EmailLocale,
  type EmailTemplateMeta,
  type RenderedEmail,
  type TemplateMeta,
} from '@/lib/emailTemplatesStore';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_SUBJECT_LEN = 998; // RFC 5322

export interface TemplateSaveInput {
  slug: string;
  name: string;
  locales: EmailLocale[];
  subject: string;
  htmlUrl: string; // 已上传到 email-templates/<slug>/ 的 Blob URL
  textUrl?: string;
  assetUrls?: string[];
}

export async function listTemplatesAction(): Promise<
  { ok: true; templates: EmailTemplateMeta[] } | { ok: false; error: string }
> {
  const guard = await ensureAdmin();
  if (guard) return guard;
  return { ok: true, templates: await listTemplates() };
}

export async function previewEmailAction(
  templateId: string
): Promise<{ ok: true; rendered: RenderedEmail } | { ok: false; error: string }> {
  const guard = await ensureAdmin();
  if (guard) return guard;
  return renderEmail(templateId);
}

// 取单个模板完整 meta（编辑回填）
export async function getTemplateAction(
  slug: string
): Promise<{ ok: true; meta: TemplateMeta | null } | { ok: false; error: string }> {
  const guard = await ensureAdmin();
  if (guard) return guard;
  return { ok: true, meta: await getTemplateMeta(slug) };
}

// 校验某个 URL 必须是本 slug 文件夹下的 Blob：防止 meta 指向其他模板 / 任意 blob 路径
function isOwnedBlobUrl(url: string, slug: string): boolean {
  return isBlobUrl(url) && url.includes(`/${TEMPLATE_PREFIX}${slug}/`);
}

export async function createOrUpdateTemplateAction(
  input: TemplateSaveInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  const slug = (input.slug ?? '').trim();
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: 'Invalid slug (use a-z, 0-9, hyphen; 1–64 chars)' };
  }

  const name = (input.name ?? '').trim();
  if (!name) return { ok: false, error: 'Name is required' };

  const subject = (input.subject ?? '').trim();
  if (!subject) return { ok: false, error: 'Subject is required' };
  if (subject.length > MAX_SUBJECT_LEN) {
    return { ok: false, error: `Subject too long (max ${MAX_SUBJECT_LEN} chars)` };
  }
  if (/[\r\n]/.test(subject)) {
    return { ok: false, error: 'Subject must not contain line breaks' };
  }

  const locales = (input.locales ?? []).filter((l): l is EmailLocale => l === 'ua' || l === 'en');
  if (locales.length === 0) return { ok: false, error: 'Pick at least one language' };

  if (!isOwnedBlobUrl(input.htmlUrl, slug)) {
    return { ok: false, error: 'HTML file must be uploaded to this template folder' };
  }
  if (input.textUrl && !isOwnedBlobUrl(input.textUrl, slug)) {
    return { ok: false, error: 'Text file must be uploaded to this template folder' };
  }
  const assetUrls = (input.assetUrls ?? []).filter((u) => typeof u === 'string');
  if (!assetUrls.every((u) => isOwnedBlobUrl(u, slug))) {
    return { ok: false, error: 'Asset files must be uploaded to this template folder' };
  }

  // slug 不持久化进 meta.json —— 它就是 blob 路径本身，读取时从路径派生
  const persisted = {
    name,
    locales,
    subject,
    htmlUrl: input.htmlUrl,
    ...(input.textUrl ? { textUrl: input.textUrl } : {}),
    ...(assetUrls.length > 0 ? { assetUrls } : {}),
    updatedAt: new Date().toISOString(),
  };

  try {
    // meta.json 固定 key + 覆盖 + 不走 CDN 缓存（编辑后立即可读）
    await put(`${TEMPLATE_PREFIX}${slug}/meta.json`, JSON.stringify(persisted), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    revalidateTag(TEMPLATE_CACHE_TAG, { expire: 0 });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'save failed') };
  }
}

export async function deleteTemplateAction(
  slug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  const clean = (slug ?? '').trim();
  if (!SLUG_RE.test(clean)) return { ok: false, error: 'Invalid slug' };

  try {
    // 扫出该文件夹下全部 blob（带 cursor 分页兜底），整批删除
    const urls: string[] = [];
    let cursor: string | undefined;
    do {
      const { blobs, cursor: next, hasMore } = await list({
        prefix: `${TEMPLATE_PREFIX}${clean}/`,
        cursor,
      });
      for (const b of blobs) urls.push(b.url);
      cursor = hasMore ? next : undefined;
    } while (cursor);

    if (urls.length === 0) return { ok: false, error: 'not found' };

    await del(urls);
    revalidateTag(TEMPLATE_CACHE_TAG, { expire: 0 });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'delete failed') };
  }
}
