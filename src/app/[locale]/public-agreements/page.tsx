import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail, MapPin, Phone } from 'lucide-react';
import { toLocale } from '@/i18n/config';
import { buildAlternates, buildOpenGraph, buildTwitter } from '@/lib/seo';
import TermsTOC from '@/components/terms/TermsTOC';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const title = t('publicAgreementsTitle');
  const description = t('publicAgreementsDescription');
  return {
    title,
    description,
    alternates: buildAlternates(locale, '/public-agreements'),
    openGraph: buildOpenGraph({ title, description, locale, path: '/public-agreements' }),
    twitter: buildTwitter({ title, description }),
  };
}

/* 区块类型 — item 是带编号的条目，subhead 是小节内的子标题 (如 4.1 / 4.2) */
type Block =
  | { type: 'item'; num: string; key: string }
  | { type: 'subhead'; key: string };

type Section = { key: string; blocks: Block[] };

/* 各小节配置 — key 用于翻译访问，blocks 描述子结构 */
const SECTIONS: Section[] = [
  {
    key: 'definitions',
    blocks: [
      { type: 'item', num: '1.1', key: 'i1' },
      { type: 'item', num: '1.2', key: 'i2' },
      { type: 'item', num: '1.3', key: 'i3' },
      { type: 'item', num: '1.4', key: 'i4' },
    ],
  },
  {
    key: 'subject',
    blocks: [
      { type: 'item', num: '2.1', key: 'i1' },
      { type: 'item', num: '2.2', key: 'i2' },
      { type: 'item', num: '2.3', key: 'i3' },
      { type: 'item', num: '2.4', key: 'i4' },
      { type: 'item', num: '2.5', key: 'i5' },
    ],
  },
  {
    key: 'acceptance',
    blocks: [
      { type: 'item', num: '3.1', key: 'i1' },
      { type: 'item', num: '3.2', key: 'i2' },
      { type: 'item', num: '3.3', key: 'i3' },
    ],
  },
  {
    key: 'rightsOrganization',
    blocks: [
      { type: 'subhead', key: 'sub1' },
      { type: 'item', num: '4.1.1', key: 'i411' },
      { type: 'item', num: '4.1.2', key: 'i412' },
      { type: 'item', num: '4.1.3', key: 'i413' },
      { type: 'subhead', key: 'sub2' },
      { type: 'item', num: '4.2.1', key: 'i421' },
      { type: 'item', num: '4.2.2', key: 'i422' },
      { type: 'item', num: '4.2.3', key: 'i423' },
    ],
  },
  {
    key: 'rightsDonor',
    blocks: [
      { type: 'subhead', key: 'sub1' },
      { type: 'item', num: '5.1.1', key: 'i511' },
      { type: 'item', num: '5.1.2', key: 'i512' },
      { type: 'subhead', key: 'sub2' },
      { type: 'item', num: '5.2.1', key: 'i521' },
    ],
  },
  {
    key: 'location',
    blocks: [
      { type: 'item', num: '6.1', key: 'i1' },
      { type: 'item', num: '6.2', key: 'i2' },
    ],
  },
  {
    key: 'procedure',
    blocks: [
      { type: 'item', num: '7.1', key: 'i1' },
      { type: 'item', num: '7.2', key: 'i2' },
      { type: 'item', num: '7.3', key: 'i3' },
    ],
  },
  {
    key: 'use',
    blocks: [
      { type: 'item', num: '8.1', key: 'i1' },
      { type: 'item', num: '8.2', key: 'i2' },
    ],
  },
  {
    key: 'responsibility',
    blocks: [
      { type: 'item', num: '9.1', key: 'i1' },
      { type: 'item', num: '9.2', key: 'i2' },
    ],
  },
  {
    key: 'confidentiality',
    blocks: [
      { type: 'item', num: '10.1', key: 'i1' },
      { type: 'item', num: '10.2', key: 'i2' },
      { type: 'item', num: '10.3', key: 'i3' },
      { type: 'item', num: '10.4', key: 'i4' },
      { type: 'item', num: '10.5', key: 'i5' },
    ],
  },
  {
    key: 'term',
    blocks: [
      { type: 'item', num: '11.1', key: 'i1' },
      { type: 'item', num: '11.2', key: 'i2' },
      { type: 'item', num: '11.3', key: 'i3' },
    ],
  },
  {
    key: 'disputes',
    blocks: [
      { type: 'item', num: '12.1', key: 'i1' },
      { type: 'item', num: '12.2', key: 'i2' },
      { type: 'item', num: '12.3', key: 'i3' },
      { type: 'item', num: '12.4', key: 'i4' },
    ],
  },
  {
    key: 'forceMajeure',
    blocks: [
      { type: 'item', num: '13.1', key: 'i1' },
      { type: 'item', num: '13.2', key: 'i2' },
      { type: 'item', num: '13.3', key: 'i3' },
      { type: 'item', num: '13.4', key: 'i4' },
    ],
  },
];

/* 装饰性大数字索引（hero 右侧显示） */
const SECTION_INDEX_MARKERS = [
  '01', '02', '03', '04', '05', '06', '07',
  '08', '09', '10', '11', '12', '13', '14',
] as const;

export default async function PublicAgreementsPage({ params }: Props) {
  setRequestLocale(toLocale((await params).locale));
  const t = await getTranslations('publicAgreementPage');

  /* 构造目录数据 — 13 节正文 + 联系信息节 */
  const tocItems = [
    ...SECTIONS.map(({ key }) => ({
      id: `section-${key}`,
      number: t(`sections.${key}.number`),
      title: t(`sections.${key}.title`),
    })),
    {
      id: 'section-contact',
      number: t('contact.number'),
      title: t('contact.title'),
    },
  ];

  return (
    <>
      {/* ═══════════ 1. HERO ═══════════ */}
      <section className="relative overflow-hidden px-3 pt-2 sm:px-6 lg:px-8">
        <div className="gradient-brand-full relative rounded-2xl px-4 py-12 sm:rounded-3xl sm:px-8 sm:py-16 lg:py-20">
          {/* 装饰光晕 */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-25 blur-3xl glow-teal" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-15 blur-3xl glow-blue" />

          {/* 大屏右侧装饰：竖排小节索引 — 暗示文档结构（14 节，紧凑排布） */}
          <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 lg:flex xl:right-16">
            <div className="flex flex-col items-end gap-1.5 font-[family-name:var(--font-data)] text-[11px] font-medium tracking-[0.2em] text-white/25">
              {SECTION_INDEX_MARKERS.map((n) => (
                <span key={n} className="flex items-center gap-3">
                  <span className="h-px w-6 bg-white/20" />
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="container-page relative">
            <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.28em] text-white/60 sm:text-sm">
              {t('hero.eyebrow')}
            </span>
            <h1 className="mt-3 max-w-4xl font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            {/* 副标题 — 与主标题协调的轻量行 */}
            <p className="mt-2 max-w-3xl font-[family-name:var(--font-display)] text-lg italic text-white/75 sm:text-xl lg:text-2xl">
              {t('hero.subtitle')}
            </p>

            {/* 状态标签 — 玻璃态药丸 */}
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-ukraine-gold-500" />
              <span className="font-[family-name:var(--font-data)] text-[11px] font-medium uppercase tracking-[0.2em] text-white/65">
                {t('hero.effectiveDateLabel')}
              </span>
              <span className="font-[family-name:var(--font-data)] text-sm font-medium text-white">
                {t('hero.effectiveDate')}
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              {t('hero.intro')}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ 2. BODY: 目录 + 正文 ═══════════ */}
      {/* section 自身不能 overflow-hidden，否则 TermsTOC 的 sticky 失效（最近滚动祖先变成 section） */}
      <section className="section-y relative">
        {/* 装饰光晕 — 独立裁剪层，吸收 overflow-hidden，不影响 sticky */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-40 h-96 w-96 rounded-full opacity-[0.04] glow-blue-soft" />
          <div className="absolute -right-40 bottom-40 h-96 w-96 rounded-full opacity-[0.04] glow-gold-soft" />
        </div>

        <div className="container-page relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            {/* 目录 — 大屏粘性 */}
            <aside className="hidden lg:col-span-3 lg:block">
              <TermsTOC items={tocItems} label={t('tocLabel')} />
            </aside>

            {/* 正文区 */}
            <div className="lg:col-span-9">
              <div className="space-y-7 sm:space-y-9">
                {/* ═══════════ 序言 — 在第 1 节之前的开篇法律陈述 ═══════════ */}
                <article className="rounded-2xl border border-ukraine-blue-100 bg-gradient-to-br from-ukraine-blue-50/50 via-white to-white p-6 sm:p-8">
                  <p className="text-[15px] leading-[1.75] text-gray-700 sm:text-base">
                    {t('preamble.p1')}
                  </p>
                  <p className="mt-4 text-[15px] leading-[1.75] text-gray-700 sm:text-base">
                    {t('preamble.p2')}
                  </p>
                </article>

                {/* ═══════════ 各小节 ═══════════ */}
                {SECTIONS.map(({ key, blocks }) => (
                  <article
                    key={key}
                    id={`section-${key}`}
                    className="scroll-mt-24"
                  >
                    {/* 小节编号 + 渐变分隔线 */}
                    <div className="flex items-center gap-4">
                      <span className="font-[family-name:var(--font-data)] text-sm font-semibold tracking-[0.15em] text-ukraine-gold-600">
                        {t(`sections.${key}.number`)}
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-ukraine-blue-200 via-ukraine-blue-100 to-transparent" />
                    </div>

                    {/* 小节标题 */}
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold leading-[1.15] tracking-tight text-ukraine-blue-900 sm:text-3xl lg:text-[2rem]">
                      {t(`sections.${key}.title`)}
                    </h2>

                    {/* 区块列表 — 支持子标题与编号条目混合渲染 */}
                    <ul className="mt-3 border-l border-ukraine-blue-100 pl-0">
                      {blocks.map((block, idx) => {
                        if (block.type === 'subhead') {
                          return (
                            <li
                              key={`${block.key}-${idx}`}
                              className="relative pl-6 pt-4 sm:pl-7"
                            >
                              <p className="font-[family-name:var(--font-display)] text-base font-semibold text-ukraine-blue-800 sm:text-[17px]">
                                {t(`sections.${key}.${block.key}`)}
                              </p>
                            </li>
                          );
                        }
                        return (
                          <li
                            key={`${block.key}-${idx}`}
                            className="group relative flex gap-4 rounded-r-xl py-1.5 pl-6 pr-4 transition-all duration-300 hover:bg-gradient-to-r hover:from-ukraine-blue-50/60 hover:to-transparent sm:gap-5 sm:pl-7"
                          >
                            {/* 圆点连接器 — hover 变金色 */}
                            <span className="absolute left-0 top-[14px] h-2 w-2 -translate-x-[5px] rounded-full border-2 border-ukraine-blue-200 bg-white transition-all duration-300 group-hover:scale-110 group-hover:border-ukraine-gold-500" />

                            {/* 子条目编号（支持 1.1 或 4.1.1 这种多级编号） */}
                            <span className="flex-shrink-0 pt-[3px] font-[family-name:var(--font-data)] text-[12px] font-semibold tracking-wider text-ukraine-blue-400 transition-colors group-hover:text-ukraine-gold-600">
                              {block.num}
                            </span>

                            {/* 正文 */}
                            <p className="text-[15px] leading-[1.65] text-gray-700 sm:text-base">
                              {t(`sections.${key}.${block.key}`)}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}

                {/* ═══════════ 联系信息节 ═══════════ */}
                <article id="section-contact" className="scroll-mt-24">
                  <div className="flex items-center gap-4">
                    <span className="font-[family-name:var(--font-data)] text-sm font-semibold tracking-[0.15em] text-ukraine-gold-600">
                      {t('contact.number')}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-ukraine-blue-200 via-ukraine-blue-100 to-transparent" />
                  </div>

                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold leading-[1.15] tracking-tight text-ukraine-blue-900 sm:text-3xl lg:text-[2rem]">
                    {t('contact.title')}
                  </h2>

                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-600 sm:text-base">
                    {t('contact.intro')}
                  </p>

                  {/* 三联联系卡片 */}
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {/* Email */}
                    <a
                      href={`mailto:${t('contact.email')}`}
                      className="group relative overflow-hidden rounded-2xl border border-ukraine-blue-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/50"
                    >
                      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ukraine-blue-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="relative">
                        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-ukraine-blue-200/50 transition-shadow duration-300 group-hover:shadow-ukraine-blue-300/60">
                          <Mail className="h-5 w-5" strokeWidth={1.6} />
                        </div>
                        <p className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-400">
                          {t('contact.emailLabel')}
                        </p>
                        <p className="mt-2 break-all text-sm font-medium text-ukraine-blue-800 transition-colors group-hover:text-ukraine-blue-600 sm:text-[15px]">
                          {t('contact.email')}
                        </p>
                      </div>
                    </a>

                    {/* Address */}
                    <div className="group relative overflow-hidden rounded-2xl border border-ukraine-blue-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/50">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ukraine-gold-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="relative">
                        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-ukraine-blue-200/50 transition-shadow duration-300 group-hover:shadow-ukraine-blue-300/60">
                          <MapPin className="h-5 w-5" strokeWidth={1.6} />
                        </div>
                        <p className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-400">
                          {t('contact.addressLabel')}
                        </p>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-ukraine-blue-800 sm:text-[15px]">
                          {t('contact.address')}
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    <a
                      href={`tel:${t('contact.phone').replace(/\s/g, '')}`}
                      className="group relative overflow-hidden rounded-2xl border border-ukraine-blue-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/50"
                    >
                      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ukraine-blue-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="relative">
                        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-ukraine-blue-200/50 transition-shadow duration-300 group-hover:shadow-ukraine-blue-300/60">
                          <Phone className="h-5 w-5" strokeWidth={1.6} />
                        </div>
                        <p className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-400">
                          {t('contact.phoneLabel')}
                        </p>
                        <p className="mt-2 font-[family-name:var(--font-data)] text-sm font-medium tracking-wide text-ukraine-blue-800 transition-colors group-hover:text-ukraine-blue-600 sm:text-[15px]">
                          {t('contact.phone')}
                        </p>
                      </div>
                    </a>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
