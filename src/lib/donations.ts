import { getAllJarBalances } from './monobank';
import { getProject } from './data';

// 项目已筹金额 = monobank jar balance（无 webhook / 无 Stripe 聚合；monobank jar 是唯一 tracked 渠道）
// 任一失败降级为 0，不阻塞渲染
export async function getRaisedAmount(projectId: number): Promise<number> {
  const [project, jars] = await Promise.all([
    getProject(projectId).catch(() => null),
    getAllJarBalances().catch(() => new Map<string, number>()),
  ]);

  const sendId = project?.monobankJarSendId;
  return sendId ? jars.get(sendId) ?? 0 : 0;
}
