import { unstable_cache } from 'next/cache';
import { promises as fs } from 'fs';
import path from 'path';
import { type NewsItem, type NewsIndex } from '@/data/news';
import { getFileText } from '@/lib/github';

const NEWS_DIR = path.join(process.cwd(), 'public', 'data', 'news');
const INDEX_PATH_REMOTE = 'public/data/news/index.json';
const ITEM_DIR_REMOTE = 'public/data/news/items';

// dev 环境下直接走 GitHub contents API 读最新 JSON —— admin 发布后无需 git pull
// 生产环境读打包进 bundle 的本地文件，避免运行时每次都调 GitHub API
const useGitHub =
  process.env.NODE_ENV === 'development' &&
  !!process.env.GITHUB_TOKEN &&
  !!process.env.GITHUB_REPO;

// 跨请求缓存 10s；admin 写操作会调 revalidateTag('news') 主动失效
export const getNewsIndex = unstable_cache(
  async (): Promise<NewsIndex> => {
    try {
      if (useGitHub) {
        const text = await getFileText(INDEX_PATH_REMOTE);
        return text ? (JSON.parse(text) as NewsIndex) : { items: [] };
      }
      const raw = await fs.readFile(path.join(NEWS_DIR, 'index.json'), 'utf-8');
      return JSON.parse(raw);
    } catch {
      return { items: [] };
    }
  },
  ['news-index'],
  { revalidate: 10, tags: ['news'] }
);

export const getNews = unstable_cache(
  async (id: string): Promise<NewsItem | null> => {
    try {
      if (useGitHub) {
        const text = await getFileText(`${ITEM_DIR_REMOTE}/${id}.json`);
        return text ? (JSON.parse(text) as NewsItem) : null;
      }
      const raw = await fs.readFile(path.join(NEWS_DIR, 'items', `${id}.json`), 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  ['news-item'],
  { revalidate: 10, tags: ['news'] }
);

// 读取所有活跃新闻（按 published_at 倒序）
export async function getAllNews(): Promise<NewsItem[]> {
  const idx = await getNewsIndex();
  const active = idx.items
    .filter((e) => e.active)
    .sort((a, b) => b.published_at.localeCompare(a.published_at));

  const results = await Promise.all(active.map((e) => getNews(e.id)));
  return results.filter((n): n is NewsItem => n !== null);
}
