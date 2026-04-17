import 'server-only';

/**
 * 针对 admin 密码校验的 IP 滑动窗口速率限制。
 *
 * 策略：每个 IP 在 WINDOW_MS 窗口内允许 MAX_FAILURES 次失败；
 * 超出则触发 LOCKOUT_MS 锁定，期间即使提交正确密码也一律返回 false。
 *
 * 限制：状态存在进程内存，Vercel 多实例 / 冷启动后会丢失。
 * 真实防爆破需要引入 Vercel KV（TODO）。但进程内计数仍能阻挡单实例
 * 的高频探测，比零防护好。
 */

const WINDOW_MS = 15 * 60_000; // 15 分钟滑动窗口
const MAX_FAILURES = 10; // 窗口内最多 10 次失败
const LOCKOUT_MS = 30 * 60_000; // 触发后锁定 30 分钟
const STATE_CAP = 2000; // 状态 Map 最多保留条目数，超出时清理过期条目

interface Entry {
  failures: number[];
  lockoutUntil: number;
}

const state = new Map<string, Entry>();

function purgeIfNeeded(now: number): void {
  if (state.size <= STATE_CAP) return;
  for (const [ip, entry] of state) {
    const hasRecentFailure = entry.failures.some((t) => now - t < WINDOW_MS);
    const stillLocked = entry.lockoutUntil > now;
    if (!hasRecentFailure && !stillLocked) {
      state.delete(ip);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  recordFailure: () => void;
}

export function rateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  purgeIfNeeded(now);

  const entry = state.get(ip) ?? { failures: [], lockoutUntil: 0 };

  if (entry.lockoutUntil > now) {
    return { allowed: false, recordFailure: () => {} };
  }

  entry.failures = entry.failures.filter((t) => now - t < WINDOW_MS);

  if (entry.failures.length >= MAX_FAILURES) {
    entry.lockoutUntil = now + LOCKOUT_MS;
    state.set(ip, entry);
    return { allowed: false, recordFailure: () => {} };
  }

  state.set(ip, entry);

  return {
    allowed: true,
    recordFailure: () => {
      entry.failures.push(Date.now());
      state.set(ip, entry);
    },
  };
}
