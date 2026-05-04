// 项目 ID 注册表 — 编译时类型检查
export const PROJECTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export type ProjectId = (typeof PROJECTS)[number];

// 双语文本
export type LocaleString = { ua: string; en: string };

// 项目静态数据类型 —— 不含已筹金额（已筹由 admin 在 /admin/amounts 维护，存 Neon 表 project_amounts）
export interface ProjectData {
  title: LocaleString;
  description: LocaleString;
  goal_amount: number | null; // null 表示无上限
  currency: string;
  tags: string[];
  // monobank 募捐罐 sendId —— send.monobank.ua/jar/{sendId} 末尾那段，用于拼捐赠跳转链接
  monobankJarSendId?: string;
  detail?: ProjectDetail;
}

// 给展示组件用的派生类型：在静态数据上叠 admin 维护的实时已筹金额
export type ProjectWithRaised = ProjectData & { raised_amount: number };

// 康复旅程阶段
export interface ProjectStage {
  title: LocaleString;
  description: LocaleString;
}

// 项目详情页数据
export interface ProjectDetail {
  subtitle: LocaleString;
  body: LocaleString[];
  benefits?: LocaleString[];
  contentImages?: string[];     // 与 benefits 并排展示的内容配图（文件名，相对于项目目录）
  stages?: ProjectStage[];
  storiesHeader?: LocaleString;
  stories?: PatientStory[];
  documents?: ProjectDocument[];
  gallery?: string[];
}

// 患者康复故事
export interface PatientStory {
  name: string;
  role: LocaleString;
  photo?: string;
  photoBefore?: string; // 康复前照片（文件名，相对于项目目录）
  photoAfter?: string;  // 康复后照片（文件名，相对于项目目录）
  photoBeforePosition?: string; // CSS object-position，覆盖默认 center（如 "top" / "center 20%"）
  photoAfterPosition?: string;
  background: LocaleString;
  injury: LocaleString[];
  recovery: {
    intro?: LocaleString;
    items: LocaleString[];
    outro?: LocaleString;
  };
  results: LocaleString[];
  quote?: LocaleString;
}

// 项目文档链接
export interface ProjectDocument {
  label: LocaleString;
  url: string;
}

// 项目索引条目类型
export interface ProjectIndexEntry {
  id: ProjectId;
  order: number;
  active: boolean;
}
