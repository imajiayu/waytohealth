import 'server-only';
import { Redis } from '@upstash/redis';

// Vercel 2024 H2 把 KV 迁到 Upstash Marketplace，官方推荐 @upstash/redis。
// Redis.fromEnv() 自动读 KV_REST_API_URL / KV_REST_API_TOKEN（也兼容 UPSTASH_* 前缀）。
export const KV_ENABLED = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

// 惰性单例：env 缺失时不要在 import 期就 throw，让 fallback 路径能走
let _redis: Redis | null = null;
export function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}
