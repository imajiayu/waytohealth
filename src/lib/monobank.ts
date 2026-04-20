import { unstable_cache } from 'next/cache';

// monobank /personal/client-info 返回的 jar 单项
interface MonobankJar {
  id: string;
  sendId: string;
  title: string;
  description?: string;
  currencyCode: number;
  balance: number; // minor units（копійки）
  goal?: number;
}

interface MonobankClientInfo {
  clientId: string;
  name: string;
  accounts?: unknown[];
  jars?: MonobankJar[];
}

// 一次拉取所有 jar，按 sendId 索引（限流：60s 最多 1 次）
async function fetchJarBalances(): Promise<Map<string, number>> {
  const token = process.env.MONOBANK_TOKEN;
  if (!token) return new Map();

  try {
    const res = await fetch('https://api.monobank.ua/personal/client-info', {
      headers: { 'X-Token': token },
      cache: 'no-store',
    });

    if (!res.ok) return new Map();

    const data = (await res.json()) as MonobankClientInfo;
    const map = new Map<string, number>();

    for (const jar of data.jars ?? []) {
      // currencyCode 980 = UAH；balance 单位是 копійки → UAH
      if (jar.currencyCode === 980 && jar.sendId) {
        map.set(jar.sendId, Math.floor(jar.balance / 100));
      }
    }

    return map;
  } catch {
    return new Map();
  }
}

// 60s 缓存 — 和 monobank 官方限流对齐，结果序列化为 [sendId, uah][] 数组
const getJarBalancesCached = unstable_cache(
  async () => {
    const map = await fetchJarBalances();
    return Array.from(map.entries());
  },
  ['monobank-jars'],
  { revalidate: 60 }
);

// 查单个 jar 的已筹金额（UAH）
export async function getJarBalance(sendId: string): Promise<number> {
  const entries = await getJarBalancesCached();
  const found = entries.find(([id]) => id === sendId);
  return found ? found[1] : 0;
}
