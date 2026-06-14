import 'server-only';
import sanitizeHtml from 'sanitize-html';

/**
 * 外部来源邮件 HTML 的清洗白名单。
 *
 * 两处复用：
 *  - Resend Inbound 转发 webhook（catch-all → Gmail）
 *  - admin 后台收件箱正文预览（EmailHistory 的 receive 视图）
 *
 * 白名单保留表格 / 内嵌 style / `<img src="cid:…">` inline 图片引用，
 * 剥 `on*` / `script` / `iframe` / `form` / `meta` / `style` / `object` / `embed`，
 * `<a>` 强制 `target=_blank rel=noopener noreferrer`。
 *
 * jsdom 在 Vercel serverless 起不来，所以走 sanitize-html 而不是 DOMPurify。
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img',
    'h1',
    'h2',
    'center',
    'font',
    'span',
    'u',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['style', 'class', 'align', 'lang', 'dir', 'title', 'width', 'height'],
    img: ['src', 'alt', 'width', 'height', 'style'],
    a: ['href', 'name', 'target', 'rel', 'title', 'style'],
    font: ['color', 'size', 'face'],
    td: ['colspan', 'rowspan', 'align', 'valign', 'style', 'width', 'height'],
    th: ['colspan', 'rowspan', 'align', 'valign', 'style', 'width', 'height'],
    table: ['align', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'style', 'width'],
  },
  // cid: 让入站 HTML 里的 <img src="cid:xxx"> 引用得以保留；转发时对应附件带 contentId 即可渲染 inline 图片
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data', 'cid'] },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
};

/** 清洗外部来源邮件 HTML（入站转发 + admin 收件箱正文预览共用）。 */
export function sanitizeInboundHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}
