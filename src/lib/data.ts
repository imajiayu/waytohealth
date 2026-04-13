import { type ProjectData, type ProjectIndexEntry } from '@/data/projects';
import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

// 读取单个项目数据（请求级去重）
export const getProject = cache(async (id: number): Promise<ProjectData> => {
  const filePath = path.join(DATA_DIR, 'projects', String(id), 'data.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
});

// 读取项目索引（请求级去重）
export const getProjectIndex = cache(async (): Promise<ProjectIndexEntry[]> => {
  const filePath = path.join(DATA_DIR, 'projects', 'index.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
});

// 读取所有活跃项目（按 order 排序）
export async function getAllProjects() {
  const index = await getProjectIndex();
  const active = index.filter((e) => e.active).sort((a, b) => a.order - b.order);

  const projects = await Promise.all(
    active.map(async (entry) => {
      const data = await getProject(entry.id);
      return {
        id: entry.id,
        ...data,
        cover: `/data/projects/${entry.id}/cover.webp`,
      };
    })
  );

  return projects;
}
