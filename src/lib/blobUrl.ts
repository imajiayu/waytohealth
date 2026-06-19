// Vercel Blob 主域校验 —— 防止管理员接口被用来把任意外链写进 DB / 当作 next/image src / 当作邮件附件 path。
// client-safe（不带 server-only）：server action 和客户端组件都可 import。
// news 图片、邮件模板资源、邮件附件共用这一份正则，避免多份漂移。

export const BLOB_URL_RE = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//;

export function isBlobUrl(u: string): boolean {
  return typeof u === 'string' && BLOB_URL_RE.test(u);
}
