'use server';

import { revalidateTag } from 'next/cache';
import { sql } from '@/lib/db';
import { ensureAdmin } from '@/lib/adminSession';
import { errorMessage } from '@/lib/errors';
import { PROJECTS } from '@/data/projects';

const VALID_IDS = new Set<number>(PROJECTS);
// 1e12 копійок 上限（10 亿 UAH，远超任何合理慈善目标）—— 防数字溢出/手滑多按 0
const MAX_RAISED_UAH = 1_000_000_000;

export interface AmountUpdate {
  projectId: number;
  raisedUah: number;
}

// 批量保存：admin 一次性把 11 行表单提交。任一行非法则整批拒绝（不做部分写入）
export async function saveProjectAmountsAction(
  updates: AmountUpdate[],
): Promise<{ ok: true; saved: number } | { ok: false; error: string }> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  if (!Array.isArray(updates) || updates.length === 0) {
    return { ok: false, error: 'no updates' };
  }

  for (const u of updates) {
    if (!VALID_IDS.has(u.projectId)) {
      return { ok: false, error: `unknown project id: ${u.projectId}` };
    }
    if (!Number.isFinite(u.raisedUah) || u.raisedUah < 0 || u.raisedUah > MAX_RAISED_UAH) {
      return { ok: false, error: `invalid amount for project ${u.projectId}` };
    }
  }

  try {
    // Neon HTTP driver 的非交互式批量事务：一次往返、原子提交，杜绝部分写入
    await sql.transaction(
      updates.map(
        (u) => sql`
          INSERT INTO project_amounts (project_id, raised_uah, updated_at)
          VALUES (${u.projectId}, ${Math.floor(u.raisedUah)}, NOW())
          ON CONFLICT (project_id) DO UPDATE
            SET raised_uah = EXCLUDED.raised_uah,
                updated_at = NOW()
        `,
      ),
    );
    revalidateTag('project-amounts', { expire: 0 });
    return { ok: true, saved: updates.length };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
