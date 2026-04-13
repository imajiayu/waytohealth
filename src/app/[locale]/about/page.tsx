import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { getTranslations } from 'next-intl/server';
import VideoStory from '@/components/about/VideoStory';
import TeamCollage from '@/components/about/TeamCollage';
import DocumentAccordion from '@/components/about/DocumentAccordion';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('aboutTitle'),
    description: t('aboutDescription'),
  };
}

type TeamMember = {
  name: string;
  role: string;
  image?: string;
};

type DocumentItem = {
  title: string;
  href: string;
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('aboutPage');

  // 视频托管在 Vercel Blob ── 所有环境（含 dev）统一从公开 CDN 拉取，
  // 避免大文件污染 git 仓库与本地工作区
  const videoSrc = locale === 'en'
    ? 'https://tuilgvi6ppemprps.public.blob.vercel-storage.com/about-us-videos/about-en.mp4'
    : 'https://tuilgvi6ppemprps.public.blob.vercel-storage.com/about-us-videos/about-ua.mp4';

  // 从翻译中获取结构化数据
  const team = Array.from({ length: 6 }, (_, i) => t.raw(`team.${i}`)) as TeamMember[];
  const rawDocs = Array.from({ length: 6 }, (_, i) => t.raw(`documents.${i}`)) as DocumentItem[];
  const documents = rawDocs.map(d => {
    let size = '—';
    try {
      const filepath = path.join(process.cwd(), 'public', d.href.replace(/^\//, ''));
      const kb = fs.statSync(filepath).size / 1024;
      size = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
    } catch { /* 文件不存在 */ }
    return { title: d.title, href: d.href, size };
  });
  const viewerLabels = t.raw('viewerLabels') as { title: string; expand: string; collapse: string; download: string; close: string };

  return (
    <article className="relative overflow-hidden">
      {/* ── 背景装饰光晕 ── */}
      <div className="pointer-events-none absolute -top-20 right-[-10%] h-[36rem] w-[36rem] rounded-full aura-cyan-xl opacity-50" />
      <div className="pointer-events-none absolute left-[-15%] top-[40%] h-[28rem] w-[28rem] rounded-full aura-gold-lg opacity-40" />
      <div className="pointer-events-none absolute right-[-10%] top-[80%] h-[32rem] w-[32rem] rounded-full aura-teal-md opacity-50" />

      {/* 装饰性垂直细线 ── 桌面端 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-[420px] bg-gradient-to-b from-transparent via-ukraine-blue-200/40 to-transparent lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px translate-x-[420px] bg-gradient-to-b from-transparent via-ukraine-blue-200/40 to-transparent lg:block"
      />

      <div className="container-page relative pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20">
        {/* ════════════════════════════════════════════
            MASTHEAD ── 杂志开篇
            ════════════════════════════════════════════ */}
        <header>
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-ukraine-gold-500" />
              <span className="font-[family-name:var(--font-data)] text-[11px] font-semibold uppercase tracking-[0.28em] text-ukraine-gold-700 sm:text-xs">
                {t('eyebrow')}
              </span>
            </div>

            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[2.5rem] font-medium leading-[0.95] tracking-[-0.02em] text-ukraine-blue-900 sm:mt-6 sm:text-[4rem] lg:text-[5.5rem]">
              {t('title')}
              <br />
              <span className="text-ukraine-blue-500">{t('titleAccent')}.</span>
            </h1>

            {/* 杂志元数据 strip ── 期间 / 地点 / 范围 */}
            <dl className="mt-6 grid grid-cols-1 gap-y-4 border-y border-ukraine-blue-200/60 py-4 sm:mt-8 sm:grid-cols-3 sm:gap-x-8 sm:py-5">
              {(['period', 'location', 'scope'] as const).map((key, i) => (
                <div
                  key={key}
                  className={i > 0 ? 'sm:border-l sm:border-ukraine-blue-200/60 sm:pl-8' : ''}
                >
                  <dt className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.28em] text-ukraine-blue-500">
                    {t(`meta.${key}.label`)}
                  </dt>
                  <dd className="mt-2 font-[family-name:var(--font-display)] text-[15px] font-medium leading-snug tracking-tight text-ukraine-blue-900 sm:text-base">
                    {t(`meta.${key}.value`)}
                  </dd>
                </div>
              ))}
            </dl>

        </header>

        {/* ════════════════════════════════════════════
            CHAPTER 01 ── ORIGIN
            ════════════════════════════════════════════ */}
        <section className="mt-14 sm:mt-20">
            {/* 大首字母 + 第一段 */}
            <p className="font-[family-name:var(--font-display)] text-2xl leading-[1.45] tracking-tight text-ukraine-blue-900 sm:text-[1.75rem] sm:leading-[1.4]">
              <span
                className="float-left mt-1 mr-3 font-[family-name:var(--font-display)] text-[5.5rem] font-medium leading-[0.78] text-ukraine-gold-500 sm:mr-4 sm:text-[7rem]"
                aria-hidden="true"
              >
                {t('paragraphs.0').charAt(0)}
              </span>
              {t('paragraphs.0').slice(1)}
            </p>

            {/* 第二段 ── 缩进偏移 */}
            <p className="mt-6 max-w-3xl text-lg leading-[1.7] text-ukraine-blue-800/85 sm:ml-16 sm:mt-8 sm:text-[1.15rem]">
              {t('paragraphs.1')}
            </p>
        </section>

        {/* ════════════════════════════════════════════
            IMPACT (大数字 + 视频)
            ════════════════════════════════════════════ */}
        <section className="mt-4 sm:mt-6">
          {/* 大数字浮雕区 */}
          <div className="relative">
            {/* 巨大描边数字背景 */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none text-center font-[family-name:var(--font-display)] text-[11rem] font-semibold leading-[0.78] tracking-[-0.04em] sm:text-[18rem] lg:text-[24rem]"
              style={{
                // ukraine-gold-500 的半透明描边，Tailwind 无法直接设置 WebkitTextStroke
                WebkitTextStroke: '1.5px rgba(245, 184, 0, 0.55)',
                color: 'transparent',
              }}
            >
              {t('impactBig')}
            </div>

            {/* 数字下方的引文 */}
            <div className="relative -mt-8 sm:-mt-16 lg:-mt-24">
                <div className="border-l-2 border-ukraine-gold-500 pl-6 sm:pl-8">
                  <p className="font-[family-name:var(--font-display)] text-2xl font-medium leading-[1.35] tracking-tight text-ukraine-blue-900 sm:text-[1.85rem] lg:text-[2.1rem]">
                    {t('impact')}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.28em] text-ukraine-blue-500 sm:text-xs">
                      {t('impactSmall')}
                    </span>
                  </div>
                </div>
            </div>
          </div>

          {/* 视频区 */}
          <div className="mt-10 grid grid-cols-12 gap-6 sm:mt-14 sm:gap-8">
            <div className="col-span-12 lg:col-span-2 lg:pt-2">
              {/* 左侧装饰：垂直运行字 */}
              <div className="hidden lg:block">
                <div
                  className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.32em] text-ukraine-blue-500"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {t('watchListenWitness')}
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-10">
              <VideoStory
                key={locale}
                src={videoSrc}
                eyebrow={t('video.eyebrow')}
                title={t('video.title')}
                meta={t('video.meta')}
                runtime={t('video.runtime')}
                rec={t('video.rec')}
                genre={t('video.genre')}
                quality={t('video.quality')}
                pressPlay={t('video.pressPlay')}
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            EVOLUTION
            ════════════════════════════════════════════ */}
        <section className="mt-14 sm:mt-20">
            <p className="text-lg leading-[1.75] text-ukraine-blue-800/85 sm:text-xl sm:leading-[1.7]">
              {t('followUp')}
            </p>

        </section>

        {/* ════════════════════════════════════════════
            VOICES (Team)
            ════════════════════════════════════════════ */}
        <section className="mt-14 sm:mt-20">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ukraine-blue-900 sm:text-4xl lg:text-5xl">
                {t('teamTitle')}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ukraine-blue-700/80 sm:text-lg">
                {t('teamSubtitle')}
              </p>

          <div className="mt-8 sm:mt-10">
            <TeamCollage members={team} noPortraitLabel={t('noPortrait')} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            DOCUMENTS
            ════════════════════════════════════════════ */}
        <section className="mt-14 sm:mt-20">
          <DocumentAccordion documents={documents} labels={viewerLabels} />
        </section>
      </div>
    </article>
  );
}
