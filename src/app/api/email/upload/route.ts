import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/adminSession';
import {
  EMAIL_ATTACH_ALLOWED_MIME,
  EMAIL_ATTACH_MAX_FILE_BYTES,
} from '@/lib/emailAttachments';

// 邮件后台两类客户端直传共用此路由，按 pathname 前缀分两套规则：
//   email-templates/    —— 模板正文 HTML / 纯文本 / 图片资源（不含 svg，避免内嵌脚本）
//   email-attachments/  —— 发信附件（pdf / office / 图片 / zip / txt 等）
// meta.json 不走这里 —— 由 createOrUpdateTemplateAction 服务端 put（固定 key + overwrite）。

// 模板资源：HTML/文本较小，图片走原图（不转码），5MB 足够
const TEMPLATE_MAX_BYTES = 5 * 1024 * 1024;
const TEMPLATE_ALLOWED_MIME = [
  'text/html',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // 身份通过 cookie 承载
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession();
        if (!session) throw new Error('unauthorized');

        if (pathname.startsWith('email-templates/')) {
          return {
            allowedContentTypes: TEMPLATE_ALLOWED_MIME,
            maximumSizeInBytes: TEMPLATE_MAX_BYTES,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({}),
          };
        }

        if (pathname.startsWith('email-attachments/')) {
          return {
            allowedContentTypes: EMAIL_ATTACH_ALLOWED_MIME,
            maximumSizeInBytes: EMAIL_ATTACH_MAX_FILE_BYTES,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({}),
          };
        }

        // 其他前缀一律拒，防止被用来写任意路径
        throw new Error('invalid path');
      },
      onUploadCompleted: async () => {
        // 当前无需回调
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    // 内部错误日志记服务端，对外一律返回通用文案
    console.error('[email:upload] failed', err);
    return NextResponse.json({ error: 'upload failed' }, { status: 400 });
  }
}
