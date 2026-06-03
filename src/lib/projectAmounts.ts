import 'server-only';
import { unstable_cache } from 'next/cache';
import { sql } from '@/lib/db';

// 项目已筹金额（人工统计 monobank + Stripe 后由 admin 在 /admin/amounts 录入）
// raised_uah 单位为 UAH 整数，不带小数（与展示组件 formatCurrency 输入对齐）
export interface ProjectAmountRow {
  projectId: number;
  raised: number;
  updatedAt: string;
}

interface DbRow {
  project_id: number;
  raised_uah: string | number;
  updated_at: Date;
}

// 60s 缓存；admin 写入会 revalidateTag('project-amounts') 立刻失效。
// try/catch 放外层：DB 抛错时 unstable_cache 不缓存空结果，下次请求会重试。
const _getProjectAmountsList = unstable_cache(
  async (): Promise<ProjectAmountRow[]> => {
    const rows = (await sql`
      SELECT project_id, raised_uah, updated_at
      FROM project_amounts
    `) as DbRow[];
    return rows.map((r) => ({
      projectId: r.project_id,
      raised: Number(r.raised_uah),
      updatedAt: r.updated_at.toISOString(),
    }));
  },
  ['project-amounts-all'],
  { revalidate: 60, tags: ['project-amounts'] },
);

export async function getProjectAmountsList(): Promise<ProjectAmountRow[]> {
  try {
    return await _getProjectAmountsList();
  } catch (err) {
    console.error('[projectAmounts:list]', err);
    return [];
  }
}

// 给前台用：projectId → 已筹金额（UAH 整数）
export async function getAllProjectAmounts(): Promise<Map<number, number>> {
  const rows = await getProjectAmountsList();
  return new Map(rows.map((r) => [r.projectId, r.raised]));
}
