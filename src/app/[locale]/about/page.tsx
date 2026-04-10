import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import VideoStory from '@/components/about/VideoStory';
import TeamCollage from '@/components/about/TeamCollage';
import DocumentLedger from '@/components/about/DocumentLedger';

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

/** 章节编号 + 标签 — 重复使用的小组件 */
function ChapterMark({ number, label, chapterLabel }: { number: string; label: string; chapterLabel: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-[family-name:var(--font-display)] text-[3.5rem] font-light leading-none text-ukraine-gold-500 sm:text-[4.5rem]">
        {number}
      </span>
      <div className="flex flex-col gap-1">
        <span className="h-px w-10 bg-ukraine-blue-300" />
        <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.28em] text-ukraine-blue-600 sm:text-xs">
          {chapterLabel}
        </span>
        <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-ukraine-blue-900 sm:text-lg">
          {label}
        </span>
      </div>
    </div>
  );
}

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
  const documents = Array.from({ length: 5 }, (_, i) => t.raw(`documents.${i}`)) as DocumentItem[];
  const ledgerLabels = t.raw('ledgerLabels') as { id: string; file: string; type: string; size: string; format: string; open: string };

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
        <header className="grid grid-cols-12 gap-6 sm:gap-8">
          {/* 左侧章节索引 ── 杂志目录式导航 */}
          <aside className="col-span-12 lg:col-span-3 lg:pt-2">
            <nav aria-label="Chapter index" className="space-y-5 border-l-2 border-ukraine-gold-500 pl-5 lg:space-y-6">
              {(['origin', 'impact', 'evolution', 'voices', 'ledger'] as const).map((key, i) => (
                <a key={key} href={`#chapter-${key}`} className="group flex items-baseline gap-3">
                  <span className="font-[family-name:var(--font-display)] text-base font-light leading-none text-ukraine-gold-500 sm:text-lg">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-sm italic text-ukraine-blue-700 transition-colors group-hover:text-ukraine-blue-900 sm:text-base">
                    {t(`chapters.${key}`)}
                  </span>
                </a>
              ))}
            </nav>
          </aside>

          {/* 标题 + 引言 */}
          <div className="col-span-12 lg:col-span-9">
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

          </div>
        </header>

        {/* ════════════════════════════════════════════
            CHAPTER 01 ── ORIGIN
            ════════════════════════════════════════════ */}
        <section id="chapter-origin" className="mt-14 grid scroll-mt-24 grid-cols-12 gap-6 sm:mt-20 sm:gap-8">
          <div className="col-span-12 lg:col-span-3">
            <ChapterMark number="01" label={t('chapters.origin')} chapterLabel={t('chapterLabel')} />
          </div>

          <div className="col-span-12 lg:col-span-9 lg:pl-4">
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
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CHAPTER 02 ── IMPACT (大数字 + 视频)
            ════════════════════════════════════════════ */}
        <section id="chapter-impact" className="mt-4 scroll-mt-24 sm:mt-6">
          <div className="relative z-10 grid grid-cols-12 gap-6 sm:gap-8">
            <div className="col-span-12 lg:col-span-3">
              <ChapterMark number="02" label={t('chapters.impact')} chapterLabel={t('chapterLabel')} />
            </div>
          </div>

          {/* 大数字浮雕区 ── 负 margin 让 500+ 与上方区域重叠 */}
          <div className="relative -mt-20 sm:-mt-36 lg:-mt-48">
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
            <div className="relative -mt-8 grid grid-cols-12 gap-6 sm:-mt-16 sm:gap-8 lg:-mt-24">
              <div className="col-span-12 lg:col-span-3" />
              <div className="col-span-12 lg:col-span-9 lg:pl-4">
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
            CHAPTER 03 ── EVOLUTION
            ════════════════════════════════════════════ */}
        <section id="chapter-evolution" className="mt-14 grid scroll-mt-24 grid-cols-12 gap-6 sm:mt-20 sm:gap-8">
          <div className="col-span-12 lg:col-span-3">
            <ChapterMark number="03" label={t('chapters.evolution')} chapterLabel={t('chapterLabel')} />
          </div>

          <div className="col-span-12 lg:col-span-9 lg:pl-4">
            <p className="text-lg leading-[1.75] text-ukraine-blue-800/85 sm:text-xl sm:leading-[1.7]">
              {t('followUp')}
            </p>

            {/* 装饰：分章符 */}
            <div className="mt-6 flex items-center gap-3 sm:mt-8">
              <span className="h-px flex-1 bg-gradient-to-r from-ukraine-blue-200 via-ukraine-gold-300 to-transparent" />
              <span className="font-[family-name:var(--font-display)] text-2xl text-ukraine-gold-500">§</span>
              <span className="h-px flex-1 bg-gradient-to-l from-ukraine-blue-200 via-ukraine-gold-300 to-transparent" />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CHAPTER 04 ── VOICES (Team)
            ════════════════════════════════════════════ */}
        <section id="chapter-voices" className="mt-14 scroll-mt-24 sm:mt-20">
          <div className="grid grid-cols-12 gap-6 sm:gap-8">
            <div className="col-span-12 lg:col-span-3">
              <ChapterMark number="04" label={t('chapters.voices')} chapterLabel={t('chapterLabel')} />
            </div>
            <div className="col-span-12 lg:col-span-9 lg:pl-4">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ukraine-blue-900 sm:text-4xl lg:text-5xl">
                {t('teamTitle')}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ukraine-blue-700/80 sm:text-lg">
                {t('teamSubtitle')}
              </p>
            </div>
          </div>

          <div className="mt-8 sm:mt-10">
            <TeamCollage members={team} noPortraitLabel={t('noPortrait')} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CHAPTER 05 ── LEDGER (Documents)
            ════════════════════════════════════════════ */}
        <section id="chapter-ledger" className="mt-14 scroll-mt-24 sm:mt-20">
          <div className="grid grid-cols-12 gap-6 sm:gap-8">
            <div className="col-span-12 lg:col-span-3">
              <ChapterMark number="05" label={t('chapters.ledger')} chapterLabel={t('chapterLabel')} />
            </div>
            <div className="col-span-12 lg:col-span-9 lg:pl-4">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ukraine-blue-900 sm:text-4xl lg:text-5xl">
                {t('transparencyTitle')}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ukraine-blue-700/80 sm:text-lg">
                {t('transparencySubtitle')}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-12 gap-6 sm:mt-8 sm:gap-8">
            <div className="col-span-12 lg:col-span-3 lg:pt-2">
              {/* 装饰印章 */}
              <div className="hidden lg:block">
                <div className="relative inline-flex h-32 w-32 items-center justify-center rounded-full border border-ukraine-gold-500/40">
                  <div className="absolute inset-2 rounded-full border border-dashed border-ukraine-gold-500/30" />
                  <div className="text-center">
                    <div className="font-[family-name:var(--font-data)] text-[9px] font-bold uppercase tracking-[0.22em] text-ukraine-gold-700">
                      {t('verified')}
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-medium leading-none text-ukraine-blue-800">
                      {t('verifiedYear')}
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-data)] text-[8px] uppercase tracking-[0.2em] text-ukraine-gold-600">
                      {t('openFiles')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-9">
              <DocumentLedger documents={documents} labels={ledgerLabels} />
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
