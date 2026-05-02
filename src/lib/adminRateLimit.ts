import 'server-only';
import { KV_ENABLED, getRedis } from './redis';

/**
 * 针对 admin 密码校验的 IP 滑动窗口速率限制。
 *
 * 策略：每个 IP 在 WINDOW_MS 窗口内允许 MAX_FAILURES 次失败；
 * 超出则触发 LOCKOUT_MS 锁定，期间即使提交正确密码也一律返回 false。
 *
 * 存储：优先 Upstash Redis / Vercel KV（跨实例共享，生产环境必需）；
 * KV 不可用（未配置 env / 本地开发）时自动降级到进程内 Map。
 */

const WINDOW_MS = 15 * 60_000; // 15 分钟滑动窗口
const MAX_FAILURES = 10; // 窗口内最多 10 次失败
const LOCKOUT_MS = 30 * 60_000; // 触发后锁定 30 分钟

function failKey(ip: string): string {
  return `admin:fail:${ip}`;
}
function lockKey(ip: string): string {
  return `admin:lock:${ip}`;
}

export interface RateLimitResult {
  allowed: boolean;
  recordFailure: () => Promise<void>;
}

/* ── KV 版 ── */

async function rateLimitKv(ip: string): Promise<RateLimitResult> {
  const now = Date.now();
  const redis = getRedis();

  const locked = await redis.get(lockKey(ip));
  if (locked) return { allowed: false, recordFailure: async () => {} };

  // 清理窗口外过期失败
  await redis.zremrangebyscore(failKey(ip), 0, now - WINDOW_MS);
  const count = await redis.zcard(failKey(ip));

  if (count >= MAX_FAILURES) {
    // 触发锁定
    await redis.set(lockKey(ip), 1, { px: LOCKOUT_MS });
    return { allowed: false, recordFailure: async () => {} };
  }

  return {
    allowed: true,
    recordFailure: async () => {
      // 用 `${now}-${random}` 作 member 确保并发下不相撞
      const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
      await redis.zadd(failKey(ip), { score: now, member });
      // 给 ZSET 设 TTL（略大于窗口），避免长期累积
      await redis.expire(failKey(ip), Math.ceil(WINDOW_MS / 1000) + 60);
    },
  };
}

/* ── 进程内 fallback（本地开发 / KV 未配置） ── */

interface Entry {
  failures: number[];
  lockoutUntil: number;
}

const memState = new Map<string, Entry>();
const STATE_CAP = 2000;

function purgeIfNeeded(now: number): void {
  if (memState.size <= STATE_CAP) return;
  for (const [ip, entry] of memState) {
    const hasRecentFailure = entry.failures.some((t) => now - t < WINDOW_MS);
    const stillLocked = entry.lockoutUntil > now;
    if (!hasRecentFailure && !stillLocked) {
      memState.delete(ip);
    }
  }
}

function rateLimitMem(ip: string): RateLimitResult {
  const now = Date.now();
  purgeIfNeeded(now);

  const entry = memState.get(ip) ?? { failures: [], lockoutUntil: 0 };

  if (entry.lockoutUntil > now) {
    return { allowed: false, recordFailure: async () => {} };
  }

  entry.failures = entry.failures.filter((t) => now - t < WINDOW_MS);

  if (entry.failures.length >= MAX_FAILURES) {
    entry.lockoutUntil = now + LOCKOUT_MS;
    memState.set(ip, entry);
    return { allowed: false, recordFailure: async () => {} };
  }

  memState.set(ip, entry);

  return {
    allowed: true,
    recordFailure: async () => {
      entry.failures.push(Date.now());
      memState.set(ip, entry);
    },
  };
}

export async function rateLimit(ip: string): Promise<RateLimitResult> {
  if (KV_ENABLED) {
    try {
      return await rateLimitKv(ip);
    } catch (err) {
      console.error('[rateLimit] KV failed, falling back to in-memory', err);
      return rateLimitMem(ip);
    }
  }
  return rateLimitMem(ip);
}
