import 'server-only';
import { KV_ENABLED, getRedis } from './redis';

/**
 * 公开表单提交的 IP 限流。
 *
 * 与 adminRateLimit 的差异：admin 是"密码失败计数 + 锁定"模型；
 * 这里是"每窗口最多 N 次提交"的简单计数器，防止机器人灌表单。
 *
 * 默认：每 IP 每 60 分钟最多 8 次提交。
 */

const WINDOW_SECONDS = 60 * 60;
const MAX_PER_WINDOW = 8;

function key(kind: string, ip: string): string {
  return `form:${kind}:${ip}`;
}

/* ── 进程内 fallback ── */
interface MemEntry { count: number; resetAt: number }
const memState = new Map<string, MemEntry>();
const STATE_CAP = 2000;
function purgeMem(now: number): void {
  if (memState.size <= STATE_CAP) return;
  for (const [k, v] of memState) if (v.resetAt <= now) memState.delete(k);
}

/** 原子 INCR + 首次 EXPIRE；返回累计 count。 */
async function bumpKv(k: string): Promise<number> {
  const r = getRedis();
  const count = (await r.incr(k)) as number;
  if (count === 1) {
    await r.expire(k, WINDOW_SECONDS);
  }
  return count;
}

function bumpMem(k: string): number {
  const now = Date.now();
  purgeMem(now);
  const e = memState.get(k);
  if (!e || e.resetAt <= now) {
    memState.set(k, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return 1;
  }
  e.count += 1;
  return e.count;
}

/**
 * 记录一次尝试并返回是否允许。任何异常降级为 allowed=true，避免把用户关在门外。
 */
export async function checkFormRateLimit(kind: string, ip: string): Promise<boolean> {
  const k = key(kind, ip);
  try {
    const count = KV_ENABLED ? await bumpKv(k) : bumpMem(k);
    return count <= MAX_PER_WINDOW;
  } catch (err) {
    console.error('[formRateLimit] failed, allowing request', err);
    return true;
  }
}
