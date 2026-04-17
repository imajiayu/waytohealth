import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/adminAuth';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (typeof clientPayload !== 'string' || !(await verifyAdminPassword(clientPayload))) {
          throw new Error('unauthorized');
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'upload error' },
      { status: 400 }
    );
  }
}
