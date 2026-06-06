import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { toLocale } from '@/i18n/config';
import { buildAlternates, buildOpenGraph, buildTwitter } from '@/lib/seo';
import HeroSection from '@/components/home/HeroSection';
import ProjectsSection from '@/components/home/ProjectsSection';
import NewsSection from '@/components/home/NewsSection';
import AboutSection from '@/components/home/AboutSection';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const title = t('homeTitle');
  const description = t('homeDescription');
  return {
    title,
    description,
    alternates: buildAlternates(locale, '/'),
    openGraph: buildOpenGraph({ title, description, locale, path: '/' }),
    twitter: buildTwitter({ title, description }),
  };
}

export default async function HomePage({ params }: Props) {
  setRequestLocale(toLocale((await params).locale));
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
