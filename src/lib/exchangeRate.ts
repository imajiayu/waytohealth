import { unstable_cache } from 'next/cache';
import { fetchWithTimeout } from './fetchWithTimeout';

// NBU（乌克兰国家银行）官方汇率 API — 公开接口，无需 key
// 返回 1 UAH 折合多少 EUR（≈ 0.022）；失败返回 null
async function fetchUahToEurRate(): Promise<number | null> {
  try {
    // 5s 超时：汇率接口若悬挂不该阻塞整条捐赠 panel 渲染
    const res = await fetchWithTimeout(
      'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=EUR&json',
      { cache: 'no-store' },
      5000
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ rate?: number }>;
    const uahPerEur = data[0]?.rate;
    if (!uahPerEur || uahPerEur <= 0) return null;
    return 1 / uahPerEur;
  } catch {
    return null;
  }
}

// 1 小时缓存 — 汇率每日发布，这个粒度足够
export const getUahToEurRate = unstable_cache(
  fetchUahToEurRate,
  ['uah-to-eur-rate'],
  { revalidate: 3600 }
);
