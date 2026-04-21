import { type LocaleString } from '@/data/projects';

// 新闻条目（对应 Neon 的 news 表一行）
export interface NewsItem {
  id: string;                  // YYYY-MM-DD-HHmm-xxxx
  published_at: string;        // ISO 8601
  title: LocaleString;
  body: LocaleString;          // 保留 \n 换行，前端用 whitespace-pre-wrap
  images?: string[];           // Vercel Blob URL 数组
}
