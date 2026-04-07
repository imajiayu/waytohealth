import { Suspense } from 'react';
import HeroSection from '@/components/home/HeroSection';
import ProjectsSection from '@/components/home/ProjectsSection';
import AboutSection from '@/components/home/AboutSection';

export default async function HomePage() {
  return (
    <>
      {/* Hero — 全屏沉浸式首图（含 Partners 滚动条） */}
      <HeroSection />

      {/* 项目展示 — 有异步数据获取，用 Suspense 实现流式传输 */}
      <Suspense>
        <ProjectsSection />
      </Suspense>

      {/* 关于我们 — 有异步数据获取（翻译），用 Suspense 实现流式传输 */}
      <Suspense>
        <AboutSection />
      </Suspense>
    </>
  );
}
