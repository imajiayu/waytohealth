// 项目 ID 注册表 — 编译时类型检查
export const PROJECTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export type ProjectId = (typeof PROJECTS)[number];

// 项目静态数据类型
export interface ProjectData {
  title: { ua: string; en: string };
  description: { ua: string; en: string };
  goal_amount: number | null; // null 表示无上限
  raised_amount: number;
  currency: string;
  tags: string[];
}

// 项目索引条目类型
export interface ProjectIndexEntry {
  id: ProjectId;
  order: number;
  active: boolean;
}
