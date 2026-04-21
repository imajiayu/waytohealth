import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { getAllProjects } from '@/lib/data';
import { siteUrl } from '@/lib/seo';

// 静态页路径（不带 locale 前缀）
const STATIC_PATHS = [
  '',
  '/about',
  '/news',
  '/merch',
  '/terms',
  '/privacy',
  '/public-agreements',
  '/projects',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  // 1) 静态页 × 2 locale
  const staticEntries: MetadataRoute.Sitemap = [];
  for (const loc of locales) {
    for (const path of STATIC_PATHS) {
      staticEntries.push({
        url: `${base}/${loc}${path}`,
        lastModified: now,
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1 : 0.7,
      });
    }
  }

  // 2) 项目详情 × 2 locale —— 使用 searchParams 模式 `?id=N`
  const projects = await getAllProjects();
  const projectEntries: MetadataRoute.Sitemap = [];
  for (const loc of locales) {
    for (const p of projects) {
      projectEntries.push({
        url: `${base}/${loc}/projects?id=${p.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  return [...staticEntries, ...projectEntries];
}
