import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminSession';
import { getResend } from '@/lib/resend';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

// 附件可能较大（Resend Inbound 单封 40MB），流式代理走 Node runtime，timeout 放宽
export const runtime = 'nodejs';
export const maxDuration = 60;

const DOWNLOAD_TIMEOUT_MS = 30_000;

/**
 * Content-Disposition 的 filename：
 *  - 剥 CRLF / 引号 / 控制字符（防 header 注入），非 ASCII 字符回退成 `_` 作 ascii fallback
 *  - 另带 RFC 5987 `filename*=UTF-8''…`，现代浏览器优先用它显示原始（含非 ASCII）文件名
 */
function buildContentDisposition(filename: string): string {
  const cleaned =
    filename
      .replace(/[\r\n"]/g, '')
      .replace(/[\x00-\x1f]/g, '')
      .trim() || 'attachment';
  const asciiFallback = cleaned.replace(/[^\x20-\x7e]/g, '_');
  const encoded = encodeURIComponent(cleaned);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * 收件邮件附件下载代理。
 *
 * admin cookie 鉴权 → `receiving.attachments.get` 拿短时签名 URL → fetch 后流式回传，
 * 带原始文件名的 Content-Disposition: attachment，强制浏览器下载。签名 URL 不暴露给前端。
 *
 * 链接由 EmailBodyModal 渲染（同源 GET），cookie 自动随行（SameSite=Strict）。
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const emailId = req.nextUrl.searchParams.get('emailId');
  const id = req.nextUrl.searchParams.get('id');
  if (!emailId || !id) {
    return NextResponse.json({ error: 'missing emailId or id' }, { status: 400 });
  }

  let resend: ReturnType<typeof getResend>;
  try {
    resend = getResend();
  } catch {
    return NextResponse.json({ error: 'resend misconfigured' }, { status: 500 });
  }

  const detail = await resend.emails.receiving.attachments.get({ emailId, id });
  if (detail.error || !detail.data?.download_url) {
    return NextResponse.json({ error: 'attachment not found' }, { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetchWithTimeout(detail.data.download_url, {}, DOWNLOAD_TIMEOUT_MS);
  } catch {
    return NextResponse.json({ error: 'download failed' }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'download failed' }, { status: 502 });
  }

  const filename = detail.data.filename || `attachment-${id}`;
  const headers = new Headers();
  headers.set('Content-Type', detail.data.content_type || 'application/octet-stream');
  headers.set('Content-Disposition', buildContentDisposition(filename));
  const contentLength = upstream.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);
  headers.set('Cache-Control', 'private, no-store');

  return new NextResponse(upstream.body, { status: 200, headers });
}
