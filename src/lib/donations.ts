import { unstable_cache } from 'next/cache';
import { getStripe } from './stripe';
import { getJarBalance } from './monobank';
import { getProject } from './data';

// 从 Stripe 查询某个项目的已筹金额（UAH）
async function fetchStripeRaisedAmount(projectId: number): Promise<number> {
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

const getStripeRaisedCached = unstable_cache(
  fetchStripeRaisedAmount,
  ['raised-amount-stripe'],
  { revalidate: 60 }
);

// 项目已筹金额 = Stripe 聚合 + monobank jar balance（任一失败降级为 0）
export async function getRaisedAmount(projectId: number): Promise<number> {
  const [stripeAmount, project] = await Promise.all([
    getStripeRaisedCached(projectId),
    getProject(projectId).catch(() => null),
  ]);

  const jarAmount = project?.monobankJarSendId
    ? await getJarBalance(project.monobankJarSendId)
    : 0;

  return stripeAmount + jarAmount;
}
