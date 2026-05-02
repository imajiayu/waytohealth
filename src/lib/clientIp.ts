import 'server-only';
import { headers } from 'next/headers';

// x-real-ip 由 Vercel 边缘设为真实 peer IP，客户端无法伪造；
// x-forwarded-for 的最左值可能来自客户端自带的伪造头，仅在非 Vercel 环境兜底
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const real = h.get('x-real-ip');
  if (real) return real.trim();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}
