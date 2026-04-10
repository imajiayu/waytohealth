// 项目 ID 注册表 — 编译时类型检查
export const PROJECTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] as const;
export type ProjectId = (typeof PROJECTS)[number];

// 双语文本
export type LocaleString = { ua: string; en: string };

// 项目静态数据类型
export interface ProjectData {
  title: LocaleString;
  description: LocaleString;
  goal_amount: number | null; // null 表示无上限
  raised_amount: number;
  currency: string;
  tags: string[];
  detail?: ProjectDetail;
}

// 项目详情页数据
export interface ProjectDetail {
  subtitle: LocaleString;
  body: LocaleString[];
  benefits?: LocaleString[];
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
