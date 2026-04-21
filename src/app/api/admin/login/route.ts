import { NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/adminAuth';
import { issueSession } from '@/lib/adminSession';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }

  const pw = typeof body === 'object' && body !== null && 'pw' in body
    ? String((body as { pw: unknown }).pw ?? '')
    : '';

  try {
    const ok = await verifyAdminPassword(pw);
    if (!ok) {
      // 通用错误：避免泄露"密码错"还是"被锁定"
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
    await issueSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin:login] failed', err);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
