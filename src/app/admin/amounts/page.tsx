import AmountsPanel from '@/components/admin/AmountsPanel';
import { getAllProjects } from '@/lib/data';
import { getAllProjectAmounts, getProjectAmountsList } from '@/lib/projectAmounts';

export const dynamic = 'force-dynamic';

export default async function AdminAmountsPage() {
  // 拉项目列表 + 已筹 map + 各行 updatedAt
  const [projects, amounts, rows] = await Promise.all([
    getAllProjects(),
    getAllProjectAmounts(),
    getProjectAmountsList(),
  ]);
  const updatedMap = new Map(rows.map((r) => [r.projectId, r.updatedAt]));

  const initial = projects.map((p) => ({
    id: p.id,
    title: p.title.ua,
    goal: p.goal_amount,
    currency: p.currency,
    raised: amounts.get(p.id) ?? 0,
    updatedAt: updatedMap.get(p.id) ?? null,
  }));

  return <AmountsPanel initial={initial} />;
}
