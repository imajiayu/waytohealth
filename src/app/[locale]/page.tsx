import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HeroSection from '@/components/home/HeroSection';
import ProjectsSection from '@/components/home/ProjectsSection';
import NewsSection from '@/components/home/NewsSection';
import AboutSection from '@/components/home/AboutSection';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
  };
}

export default async function HomePage() {
  return (
    <>
      {/* Hero — 全屏沉浸式首图（含 Partners 滚动条） */}
      <HeroSection />

      {/* 项目展示 — 有异步数据获取，用 Suspense 实现流式传输 */}
      <Suspense fallback={<div className="section-y" />}>
        <ProjectsSection />
      </Suspense>

      {/* 新闻信息流 — 读 GitHub/本地 JSON，空列表时 section 自动隐藏 */}
      <Suspense fallback={<div className="section-y" />}>
        <NewsSection />
      </Suspense>

      {/* 关于我们 — 有异步数据获取（翻译），用 Suspense 实现流式传输 */}
      <Suspense fallback={<div className="section-y" />}>
        <AboutSection />
      </Suspense>
    </>
  );
}
