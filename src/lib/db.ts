import 'server-only';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// 懒加载 client：build 时 Next.js 会导入所有 server 模块做 page-data collection，
// 那时 DATABASE_URL 可能还没注入；首次真正 query 才创建客户端，避免 build crash。
type Sql = NeonQueryFunction<false, false>;

let cached: Sql | null = null;

function resolve(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

// Proxy 保留 tagged template 语法（`sql\`SELECT ...\``），同时把 client 的其他方法也透出去
export const sql = new Proxy(function proxied() {} as unknown as Sql, {
  apply(_t, _this, args) {
    cached ??= resolve();
    return Reflect.apply(cached as unknown as (...a: unknown[]) => unknown, undefined, args);
  },
  get(_t, prop) {
    cached ??= resolve();
    const value = Reflect.get(cached as unknown as object, prop);
    return typeof value === 'function' ? value.bind(cached) : value;
  },
});
