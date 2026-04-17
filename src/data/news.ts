import { type LocaleString } from '@/data/projects';

// 新闻条目（单条 JSON 对应一条）
export interface NewsItem {
  id: string;                  // YYYY-MM-DD-HHmm-xxxx
  published_at: string;        // ISO 8601
  title: LocaleString;
  body: LocaleString;          // 保留 \n 换行，前端用 whitespace-pre-wrap
  images?: string[];           // Vercel Blob URL 数组（旧数据允许相对文件名作兼容）
}

export interface NewsIndexEntry {
  id: string;
  published_at: string;
  active: boolean;
}

export interface NewsIndex {
  items: NewsIndexEntry[];
}
