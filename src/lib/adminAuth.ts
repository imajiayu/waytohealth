import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { headers } from 'next/headers';
import { rateLimit } from './adminRateLimit';

const SALT = process.env.ADMIN_PASSWORD_SALT ?? 'wth-news-2026';

function sha256Hex(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return h.get('x-real-ip') ?? 'unknown';
}

/**
 * 常数时间比对 SHA-256(pw + SALT) 与 ADMIN_PASSWORD_HASH。
 * 同时按 IP 做滑动窗口限流：失败过多 → 锁定期内一律返回 false,
 * 即使后续提交正确密码也拒绝（直到锁定过期）。
 */
export async function verifyAdminPassword(pw: string): Promise<boolean> {
  const ip = await getClientIp();
  const limit = rateLimit(ip);
  if (!limit.allowed) return false;

  const expected = process.env.ADMIN_PASSWORD_HASH;
  if (!pw || !expected || expected.length !== 64) {
    limit.recordFailure();
    return false;
  }
  const actual = sha256Hex(pw + SALT);
  try {
    const ok = timingSafeEqual(
      Buffer.from(actual, 'hex'),
      Buffer.from(expected, 'hex')
    );
    if (!ok) limit.recordFailure();
    return ok;
  } catch {
    limit.recordFailure();
    return false;
  }
}
