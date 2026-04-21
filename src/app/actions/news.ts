'use server';

import { del } from '@vercel/blob';
import { revalidateTag } from 'next/cache';
import { type NewsItem, type NewsIndex, type NewsIndexEntry } from '@/data/news';
import { commitBatch, getFileText, type FileChange } from '@/lib/github';
import { verifyAdminPassword } from '@/lib/adminAuth';

const INDEX_PATH = 'public/data/news/index.json';
const ITEM_DIR = 'public/data/news/items';

// 仅允许 Vercel Blob 主域：防止管理员接口被用来把外链写进前台 next/image
const BLOB_URL_RE = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//;

function isBlobUrl(u: string): boolean {
  return BLOB_URL_RE.test(u);
}

function toBase64Utf8(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

// 从 ISO 时间串生成 id
function makeNewsId(publishedAt: string): string {
  const d = new Date(publishedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const timeStr = `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
  return `${dateStr}-${timeStr}-${randomSuffix()}`;
}

async function readIndex(): Promise<NewsIndex> {
  const text = await getFileText(INDEX_PATH);
  if (!text) return { items: [] };
  try {
    return JSON.parse(text) as NewsIndex;
  } catch {
    return { items: [] };
  }
}

function indexToBase64(index: NewsIndex): string {
  return toBase64Utf8(JSON.stringify(index, null, 2) + '\n');
}

export async function verifyPasswordAction(pw: string): Promise<boolean> {
  return await verifyAdminPassword(pw);
}

export interface PublishInput {
  published_at: string;
  title: { ua: string; en: string };
  body: { ua: string; en: string };
  imageUrls: string[]; // 客户端已上传到 Blob 后回传的 URL
}

export async function publishNewsAction(
  pw: string,
  input: PublishInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await verifyAdminPassword(pw))) return { ok: false, error: 'unauthorized' };

  if (!input.title.ua.trim() || !input.title.en.trim()) {
    return { ok: false, error: 'title required' };
  }
  if (!input.body.ua.trim() || !input.body.en.trim()) {
    return { ok: false, error: 'body required' };
  }
  if (!input.imageUrls.every(isBlobUrl)) {
    return { ok: false, error: 'invalid image url' };
  }

  const id = makeNewsId(input.published_at);

  try {
    const item: NewsItem = {
      id,
      published_at: input.published_at,
      title: input.title,
      body: input.body,
      ...(input.imageUrls.length ? { images: input.imageUrls } : {}),
    };

    const index = await readIndex();
    const entry: NewsIndexEntry = {
      id,
      published_at: input.published_at,
      active: true,
    };
    const nextIndex: NewsIndex = {
      items: [entry, ...index.items.filter((e) => e.id !== id)],
    };

    // 一次 commit：新 item JSON + 更新 index.json → 只触发 1 次 Vercel 部署
    const changes: FileChange[] = [
      {
        path: `${ITEM_DIR}/${id}.json`,
        contentBase64: toBase64Utf8(JSON.stringify(item, null, 2) + '\n'),
      },
      { path: INDEX_PATH, contentBase64: indexToBase64(nextIndex) },
    ];
    await commitBatch(changes, `news: publish ${id}`);

    // Next.js 16 需要传 cacheLife profile；写操作要立即失效，所以 expire: 0
    revalidateTag('news', { expire: 0 });
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function deleteNewsAction(
  pw: string,
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await verifyAdminPassword(pw))) return { ok: false, error: 'unauthorized' };

  try {
    const itemText = await getFileText(`${ITEM_DIR}/${id}.json`);
    let blobUrls: string[] = [];
    if (itemText) {
      try {
        const parsed = JSON.parse(itemText) as NewsItem;
        blobUrls = (parsed.images ?? []).filter((u) => /^https?:\/\//.test(u));
      } catch {
        /* ignore */
      }
    }

    // 从 Vercel Blob 删除图片（失败不阻塞流程，但必须记录日志以便排查孤儿文件）
    if (blobUrls.length > 0) {
      try {
        await del(blobUrls);
      } catch (err) {
        console.error('[news:delete] blob cleanup failed', {
          id,
          urls: blobUrls,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const index = await readIndex();
    const nextIndex: NewsIndex = {
      items: index.items.filter((e) => e.id !== id),
    };

    // 一次 commit：删除 item JSON + 更新 index.json
    const changes: FileChange[] = [
      { path: `${ITEM_DIR}/${id}.json`, contentBase64: null },
      { path: INDEX_PATH, contentBase64: indexToBase64(nextIndex) },
    ];
    await commitBatch(changes, `news: unpublish ${id}`);

    // Next.js 16 需要传 cacheLife profile；写操作要立即失效，所以 expire: 0
    revalidateTag('news', { expire: 0 });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

// 清理未关联到任何新闻的 Blob 图（发布失败时回滚用）
export async function cleanupBlobAction(
  pw: string,
  urls: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await verifyAdminPassword(pw))) return { ok: false, error: 'unauthorized' };
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

export async function listNewsAction(
  pw: string
): Promise<{ ok: true; items: NewsItem[] } | { ok: false; error: string }> {
  if (!(await verifyAdminPassword(pw))) return { ok: false, error: 'unauthorized' };

  try {
    const index = await readIndex();
    const sorted = [...index.items].sort((a, b) =>
      b.published_at.localeCompare(a.published_at)
    );
    // 并行拉取所有条目；单条失败/损坏跳过，保持列表顺序
    const texts = await Promise.all(
      sorted.map((entry) => getFileText(`${ITEM_DIR}/${entry.id}.json`))
    );
    const items: NewsItem[] = [];
    for (const text of texts) {
      if (!text) continue;
      try {
        items.push(JSON.parse(text) as NewsItem);
      } catch {
        /* skip broken */
      }
    }
    return { ok: true, items };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}
