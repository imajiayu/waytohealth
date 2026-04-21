import { NextResponse } from 'next/server';
import { getSession } from '@/lib/adminSession';

export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, exp: session.exp });
}
