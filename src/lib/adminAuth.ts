import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { rateLimit } from './adminRateLimit';
import { getClientIp } from './clientIp';

// 强制从 env 读；不做 fallback，避免未来某环境漏设时静默走上已进 git 的弱默认值
const SALT = process.env.ADMIN_PASSWORD_SALT;

function sha256Hex(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * 常数时间比对 SHA-256(pw + SALT) 与 ADMIN_PASSWORD_HASH。
 * 同时按 IP 做滑动窗口限流：失败过多 → 锁定期内一律返回 false,
 * 即使后续提交正确密码也拒绝（直到锁定过期）。
 */
export async function verifyAdminPassword(pw: string): Promise<boolean> {
  if (!SALT) {
    // Fail loud — 配置错误不该静默，否则可能退化到弱默认值
    throw new Error('ADMIN_PASSWORD_SALT env var is required');
  }

  const ip = await getClientIp();
  const limit = await rateLimit(ip);
  if (!limit.allowed) return false;

  const expected = process.env.ADMIN_PASSWORD_HASH;
  if (!pw || !expected || expected.length !== 64) {
    await limit.recordFailure();
    return false;
  }
  const actual = sha256Hex(pw + SALT);
  try {
    const ok = timingSafeEqual(
      Buffer.from(actual, 'hex'),
      Buffer.from(expected, 'hex')
    );
    if (!ok) await limit.recordFailure();
    return ok;
  } catch {
    await limit.recordFailure();
    return false;
  }
}
