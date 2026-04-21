import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/adminSession';

// 单张上传上限 8MB；前端侧有软限制提示，这里是服务端硬限制
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

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
      // 身份通过 cookie 承载，不再从 clientPayload 读密码
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession();
        if (!session) throw new Error('unauthorized');

        // 仅允许 news/ 前缀，防止被用来写其他路径
        if (!pathname.startsWith('news/')) {
          throw new Error('invalid path');
        }

        return {
          allowedContentTypes: ALLOWED_MIME,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async () => {
        // 当前无需回调
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    // 内部错误日志记服务端，对外一律返回通用文案
    console.error('[news:upload] failed', err);
    return NextResponse.json({ error: 'upload failed' }, { status: 400 });
  }
}
