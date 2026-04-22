'use server';

import { del } from '@vercel/blob';
import { revalidateTag } from 'next/cache';
import { sql } from '@/lib/db';
import { type NewsItem, type Tag } from '@/data/news';
import { requireAdmin } from '@/lib/adminSession';

// 仅允许 Vercel Blob 主域：防止管理员接口被用来把外链写进前台 next/image
const BLOB_URL_RE = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//;

function isBlobUrl(u: string): boolean {
  return BLOB_URL_RE.test(u);
}

const MAX_TAGS_PER_POST = 6;
const MAX_TAG_LENGTH = 30;

// 规范化管理员提交的 tag：trim、截长、去重（按 en.toLowerCase）、上限
// 前端 TagInput 也做一次相同逻辑；这里是服务端兜底，防止绕过 UI
function normalizeTags(raw: Tag[]): Tag[] {
  const seen = new Set<string>();
  const out: Tag[] = [];
  for (const t of raw) {
    const ua = (t?.ua ?? '').trim().slice(0, MAX_TAG_LENGTH);
    const en = (t?.en ?? '').trim().slice(0, MAX_TAG_LENGTH);
    if (!ua || !en) continue;
    const key = en.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ua, en });
    if (out.length >= MAX_TAGS_PER_POST) break;
  }
  return out;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

// 从 ISO 时间串生成 id；无效日期直接抛错，避免写入 "NaN-NaN-..." 这种脏 id
function makeNewsId(publishedAt: string): string {
  const d = new Date(publishedAt);
  if (!Number.isFinite(d.getTime())) {
    throw new Error(`invalid published_at: ${publishedAt}`);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const timeStr = `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
  return `${dateStr}-${timeStr}-${randomSuffix()}`;
}

interface NewsRow {
  id: string;
  published_at: Date;
  title: { ua: string; en: string };
  body: { ua: string; en: string };
  images: string[];
  tags: Tag[];
}

function rowToItem(r: NewsRow): NewsItem {
  return {
    id: r.id,
    published_at: r.published_at.toISOString(),
    title: r.title,
    body: r.body,
    ...(r.images && r.images.length > 0 ? { images: r.images } : {}),
    ...(r.tags && r.tags.length > 0 ? { tags: r.tags } : {}),
  };
}

export interface PublishInput {
  published_at: string;
  title: { ua: string; en: string };
  body: { ua: string; en: string };
  imageUrls: string[]; // 客户端已上传到 Blob 后回传的 URL
  tags?: Tag[];        // 可选，缺省视为无 tag
}

export async function publishNewsAction(
  input: PublishInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }

  if (!input.title.ua.trim() || !input.title.en.trim()) {
    return { ok: false, error: 'title required' };
  }
  if (!input.body.ua.trim() || !input.body.en.trim()) {
    return { ok: false, error: 'body required' };
  }
  if (!input.imageUrls.every(isBlobUrl)) {
    return { ok: false, error: 'invalid image url' };
  }

  let id: string;
  try {
    id = makeNewsId(input.published_at);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'invalid date' };
  }

  const tags = normalizeTags(input.tags ?? []);

  try {
    await sql`
      INSERT INTO news (id, published_at, title, body, images, tags)
      VALUES (
        ${id},
        ${input.published_at}::timestamptz,
        ${JSON.stringify(input.title)}::jsonb,
        ${JSON.stringify(input.body)}::jsonb,
        ${input.imageUrls}::text[],
        ${JSON.stringify(tags)}::jsonb
      )
    `;

    // 写操作要立即失效，Next.js 16 要求显式 cacheLife profile
    revalidateTag('news', { expire: 0 });
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function deleteNewsAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }

  try {
    // 先查出要删的 blob urls；DELETE RETURNING 一条 SQL 拿到要清理的图片
    const rows = (await sql`
      DELETE FROM news WHERE id = ${id} RETURNING images
    `) as { images: string[] }[];

    if (rows.length === 0) {
      return { ok: false, error: 'not found' };
    }

    revalidateTag('news', { expire: 0 });

    // 只清理真正由本服务上传到 Vercel Blob 的图；其他 URL 不动
    const blobUrls = (rows[0].images ?? []).filter(isBlobUrl);
    if (blobUrls.length > 0) {
      try {
        await del(blobUrls);
      } catch (err) {
        // Blob 清理失败不回滚（DB 记录已删）—— 记日志后续 sweeper 可扫
        console.error('[news:delete] blob cleanup failed', {
          id,
          urls: blobUrls,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

// 清理未关联到任何新闻的 Blob 图（发布失败时回滚用）
export async function cleanupBlobAction(
  urls: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }
  if (urls.length === 0) return { ok: true };
  if (!urls.every(isBlobUrl)) {
    return { ok: false, error: 'invalid image url' };
  }
  try {
    await del(urls);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'cleanup failed' };
  }
}

export async function listNewsAction(): Promise<
  { ok: true; items: NewsItem[] } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: 'unauthorized' };
  }

  try {
    const rows = (await sql`
      SELECT id, published_at, title, body, images, tags
      FROM news
      ORDER BY published_at DESC
    `) as NewsRow[];
    return { ok: true, items: rows.map(rowToItem) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}
