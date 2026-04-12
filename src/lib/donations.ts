import { unstable_cache } from 'next/cache';
import { getStripe } from './stripe';

// 从 Stripe 查询某个项目的已筹金额（UAH）
async function fetchRaisedAmount(projectId: number): Promise<number> {
  try {
    const stripe = getStripe();
    let totalKopiykas = 0;
    let hasMore = true;
    let nextPage: string | undefined;

    while (hasMore) {
      const result = await stripe.paymentIntents.search({
        query: `status:'succeeded' AND metadata['project_id']:'${projectId}'`,
        limit: 100,
        ...(nextPage ? { page: nextPage } : {}),
      });

      for (const pi of result.data) {
        totalKopiykas += pi.amount;
      }

      hasMore = result.has_more;
      nextPage = result.next_page ?? undefined;
    }

    // 转换为 UAH（1 UAH = 100 копійок）
    return Math.floor(totalKopiykas / 100);
  } catch {
    // Stripe 调用失败时（如无 key）返回 0，不阻塞渲染
    return 0;
  }
}

// 带缓存的已筹金额查询（60 秒 revalidate）
export const getRaisedAmount = unstable_cache(
  fetchRaisedAmount,
  ['raised-amount'],
  { revalidate: 60 }
);
