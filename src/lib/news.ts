import 'server-only';
import { unstable_cache } from 'next/cache';
import { sql } from '@/lib/db';
import { type NewsItem, type Tag } from '@/data/news';

// DB 行到前端类型的映射；空 images / tags 数组不序列化进对象（保持和旧 JSON 形状一致）
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

// 跨请求缓存 60s；admin 写操作会调 revalidateTag('news') 主动失效
export const getAllNews = unstable_cache(
  async (): Promise<NewsItem[]> => {
    try {
      const rows = (await sql`
        SELECT id, published_at, title, body, images, tags
        FROM news
        ORDER BY published_at DESC
      `) as NewsRow[];
      return rows.map(rowToItem);
    } catch (err) {
      console.error('[news:getAllNews]', err);
      return [];
    }
  },
  ['news-all'],
  { revalidate: 60, tags: ['news'] }
);

export const getNews = unstable_cache(
  async (id: string): Promise<NewsItem | null> => {
    try {
      const rows = (await sql`
        SELECT id, published_at, title, body, images, tags
        FROM news
        WHERE id = ${id}
      `) as NewsRow[];
      return rows[0] ? rowToItem(rows[0]) : null;
    } catch (err) {
      console.error('[news:getNews]', err);
      return null;
    }
  },
  ['news-item'],
  { revalidate: 60, tags: ['news'] }
);
