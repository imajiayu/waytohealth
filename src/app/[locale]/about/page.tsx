import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import FadeInSection from '@/components/about/FadeInSection';

const STAT_KEYS = ['years', 'patients', 'funds', 'partners'] as const;
const TIMELINE_COUNT = 4;
const STEP_COUNT = 4;
const ACHIEVEMENT_COUNT = 4;
const VALUE_KEYS = ['transparency', 'speed', 'result'] as const;

/* ── 图标集 ── */

const STAT_ICONS: Record<string, React.ReactNode> = {
  years: (
    <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="20" cy="20" r="15" />
      <path d="M20 12v9l5.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  patients: (
    <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 5C12 5 5 11.5 5 19c0 5 2.8 9.5 7 12L20 35l8-4c4.2-2.5 7-7 7-12 0-7.5-7-14-15-14z" />
      <path d="M15 19h10M20 14v10" strokeLinecap="round" />
    </svg>
  ),
  funds: (
    <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 30V15l12-7 12 7v15l-12 7z" />
      <path d="M8 15l12 7m0 0l12-7m-12 7v15" opacity="0.4" />
    </svg>
  ),
  partners: (
    <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="14" cy="15" r="5" />
      <circle cx="26" cy="15" r="5" />
      <path d="M5 33c0-5 4-9 9-9 2 0 3.7.6 5 1.5A9 9 0 0 1 25 24c5 0 9 4 9 9" strokeLinecap="round" />
    </svg>
  ),
};

const VALUE_ICONS: Record<string, React.ReactNode> = {
  transparency: (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="5" />
      <path d="M2 16s5.5-9 14-9 14 9 14 9-5.5 9-14 9-14-9-14-9z" />
    </svg>
  ),
  speed: (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2L6 18h9l-2 12 12-16h-9z" />
    </svg>
  ),
  result: (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="13" />
      <circle cx="16" cy="16" r="8" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  ),
};

const VALUE_ACCENTS: Record<string, string> = {
  transparency: 'from-ukraine-blue-400 to-ukraine-blue-200',
  speed: 'from-ukraine-gold-500 to-ukraine-gold-300',
  result: 'from-life-500 to-ukraine-blue-300',
};

const STEP_ICONS = [
  // 用户/申请
  <svg key="step0" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="11" r="6" />
    <path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10" />
  </svg>,
  // 医疗/即刻
  <svg key="step1" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="20" height="20" rx="4" />
    <path d="M12 16h8M16 12v8" />
  </svg>,
  // 支持/资金
  <svg key="step2" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4C9 4 4 9 4 15c0 4 2.3 7.7 5.7 9.6L16 28l6.3-3.4C25.7 22.7 28 19 28 15c0-6-5-11-12-11z" />
    <path d="M12 15h8" />
  </svg>,
  // 康复/完成
  <svg key="step3" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="16" r="12" />
    <path d="M11 16l3.5 3.5L21.5 12" />
  </svg>,
];

/* 无图片时的占位渐变 */
const ACHIEVEMENT_GRADIENTS = [
  '',
  'from-warm-500 to-ukraine-gold-400',
  'from-life-500 to-ukraine-blue-300',
  'from-ukraine-gold-500 to-ukraine-blue-400',
];

const ACHIEVEMENT_ICONS = [
  null,
  <svg key="ach1" viewBox="0 0 64 64" className="h-14 w-14" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="10" y="26" width="44" height="20" rx="5" />
    <circle cx="20" cy="46" r="5" />
    <circle cx="44" cy="46" r="5" />
    <path d="M16 26l5-10h22l5 10" />
  </svg>,
  <svg key="ach2" viewBox="0 0 64 64" className="h-14 w-14" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 6L8 18v28l24 12 24-12V18z" />
    <path d="M8 18l24 12m0 0l24-12m-24 12v24" opacity="0.4" />
  </svg>,
  <svg key="ach3" viewBox="0 0 64 64" className="h-14 w-14" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="22" cy="22" r="10" />
    <circle cx="42" cy="22" r="10" />
    <circle cx="32" cy="42" r="10" />
  </svg>,
];

export default async function AboutPage() {
  const [t, tAbout, tNav] = await Promise.all([
    getTranslations('aboutPage'),
    getTranslations('about'),
    getTranslations('navigation'),
  ]);

  return (
    <>
      {/* ═══════════ 1. Hero ═══════════ */}
      <section className="relative overflow-hidden px-3 pt-2 sm:px-6 lg:px-8">
        <div className="gradient-brand-full relative rounded-2xl px-4 py-20 sm:rounded-3xl sm:px-8 sm:py-28 lg:py-36">
          {/* 装饰光晕 */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-25 blur-3xl glow-teal" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-15 blur-3xl glow-blue" />

          <div className="container-page relative">
            <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.25em] text-white/60 sm:text-sm">
              {t('hero.eyebrow')}
            </span>
            <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              {t('hero.intro')}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ 2. 统计数据 ═══════════ */}
      <section className="relative py-16 sm:py-24">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {STAT_KEYS.map((key) => (
              <FadeInSection key={key}>
                <div className="group relative h-full rounded-xl border border-ukraine-blue-100/60 bg-white p-5 transition-all duration-300 hover:border-ukraine-blue-200 hover:shadow-lg hover:shadow-ukraine-blue-100/40 sm:rounded-2xl sm:p-8">
                  <div className="mb-3 text-ukraine-blue-300 transition-colors duration-300 group-hover:text-ukraine-blue-500 sm:mb-4">
                    {STAT_ICONS[key]}
                  </div>
                  <div className="font-[family-name:var(--font-data)] text-3xl font-bold tracking-tight text-ukraine-blue-700 sm:text-4xl lg:text-5xl">
                    {tAbout(`stats.${key}.value`)}
                  </div>
                  {key === 'funds' && (
                    <span className="mt-1 block font-[family-name:var(--font-data)] text-sm font-medium text-ukraine-blue-400">
                      {tAbout('stats.funds.unit')}
                    </span>
                  )}
                  <p className="mt-2 text-sm leading-snug text-gray-500 sm:text-base">
                    {tAbout(`stats.${key}.label`)}
                  </p>
                  <div className="absolute bottom-0 left-6 right-6 h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-500 group-hover:scale-x-100 gradient-brand-line" />
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 3. 我们的故事（时间线） ═══════════ */}
      <section className="relative overflow-hidden bg-gray-50/60 py-16 sm:py-24">
        {/* 装饰 */}
        <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full opacity-[0.04] glow-blue-soft" />

        <div className="container-page relative">
          <FadeInSection>
            <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
              {t('story.title')}
            </span>
            <h2 className="mt-2 max-w-xl font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
              {t('story.title')}
            </h2>
            <div className="mt-3 accent-line" />
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              {t('story.intro')}
            </p>
          </FadeInSection>

          {/* 时间线 */}
          <div className="relative mt-12 sm:mt-16">
            {/* 竖线（仅桌面） */}
            <div className="absolute left-[23px] top-2 hidden h-[calc(100%-16px)] w-[2px] rounded-full bg-gradient-to-b from-ukraine-blue-300 via-ukraine-blue-200 to-ukraine-blue-100 lg:left-1/2 lg:-ml-[1px] lg:block" />

            <div className="space-y-8 lg:space-y-12">
              {Array.from({ length: TIMELINE_COUNT }, (_, i) => (
                <FadeInSection key={i} delay={i * 100}>
                  <div className={`relative flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-12 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    {/* 年份圆点 — 移动端左侧，桌面端居中 */}
                    <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-ukraine-blue-300 bg-white font-[family-name:var(--font-data)] text-xs font-bold text-ukraine-blue-600 lg:left-1/2 lg:-ml-6 lg:top-1">
                      {t(`story.items.${i}.year`)}
                    </div>

                    {/* 内容卡片 */}
                    <div className={`ml-16 rounded-xl border border-ukraine-blue-100/60 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-ukraine-blue-100/30 sm:p-7 lg:ml-0 lg:w-[calc(50%-48px)] ${i % 2 === 1 ? 'lg:text-right' : ''}`}>
                      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-ukraine-blue-800 sm:text-xl">
                        {t(`story.items.${i}.title`)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                        {t(`story.items.${i}.text`)}
                      </p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 4. 使命 & 愿景 ═══════════ */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute -right-40 -bottom-40 h-[480px] w-[480px] rounded-full opacity-[0.06] glow-brand-soft" />

        <div className="container-page relative">
          <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16">
            {/* 左：照片 */}
            <FadeInSection>
              <div className="relative">
                <div className="absolute -top-4 -left-4 h-full w-full rounded-2xl gradient-brand opacity-10" />
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src="/images/about-team.jpg"
                    alt={tAbout('title')}
                    width={720}
                    height={480}
                    className="h-auto w-full object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            </FadeInSection>

            {/* 右：使命 + 愿景 */}
            <div className="flex flex-col gap-8 sm:gap-10">
              <FadeInSection delay={100}>
                <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-ukraine-blue-400 before:to-ukraine-blue-200">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ukraine-blue-800 sm:text-2xl">
                    {tAbout('mission.title')}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-gray-600 sm:text-lg">
                    {tAbout('mission.text')}
                  </p>
                </div>
              </FadeInSection>

              <FadeInSection delay={200}>
                <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-ukraine-gold-400 before:to-ukraine-gold-200">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ukraine-blue-800 sm:text-2xl">
                    {tAbout('vision.title')}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-gray-600 sm:text-lg">
                    {tAbout('vision.text')}
                  </p>
                </div>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 5. 价值观 ═══════════ */}
      <section className="relative bg-gray-50/60 py-16 sm:py-24">
        <div className="container-page">
          <FadeInSection>
            <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
              {tNav('about')}
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
              {tAbout('values.title')}
            </h2>
            <div className="mt-3 accent-line" />
          </FadeInSection>

          <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-3">
            {VALUE_KEYS.map((key, i) => (
              <FadeInSection key={key} delay={i * 100}>
                <div className="group relative h-full overflow-hidden rounded-xl border border-ukraine-blue-100/60 bg-white p-5 transition-all duration-300 hover:border-ukraine-blue-200 hover:shadow-lg hover:shadow-ukraine-blue-100/40 sm:rounded-2xl sm:p-8">
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${VALUE_ACCENTS[key]} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                  <div className="mb-4 text-ukraine-blue-300 transition-colors duration-300 group-hover:text-ukraine-blue-500">
                    {VALUE_ICONS[key]}
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-ukraine-blue-800 sm:text-xl">
                    {tAbout(`values.${key}.name`)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                    {tAbout(`values.${key}.text`)}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 6. 工作方式 ═══════════ */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full opacity-[0.04] glow-gold-soft" />

        <div className="container-page relative">
          <FadeInSection>
            <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
              {t('howWeWork.title')}
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
              {t('howWeWork.title')}
            </h2>
            <div className="mt-3 accent-line" />
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              {t('howWeWork.intro')}
            </p>
          </FadeInSection>

          {/* 4步流程 */}
          <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <FadeInSection key={i} delay={i * 120}>
                <div className="group relative h-full rounded-xl border border-ukraine-blue-100/60 bg-white p-5 transition-all duration-300 hover:border-ukraine-blue-200 hover:shadow-lg hover:shadow-ukraine-blue-100/40 sm:rounded-2xl sm:p-7">
                  {/* 步骤编号 */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-brand text-white transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-ukraine-blue-200/50">
                      {STEP_ICONS[i]}
                    </div>
                    <span className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-widest text-ukraine-blue-300">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-ukraine-blue-800">
                    {t(`howWeWork.steps.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                    {t(`howWeWork.steps.${i}.text`)}
                  </p>

                  {/* 连接箭头（仅桌面，最后一个不显示） */}
                  {i < STEP_COUNT - 1 && (
                    <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 text-ukraine-blue-200 lg:block">
                      <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 4l4 4-4 4" />
                      </svg>
                    </div>
                  )}
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 7. 成就展示 ═══════════ */}
      <section className="relative bg-gray-50/60 py-16 sm:py-24">
        <div className="container-page">
          <FadeInSection>
            <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
              {tNav('about')}
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
              {tAbout('achievements.title')}
            </h2>
            <div className="mt-3 accent-line" />
          </FadeInSection>

          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2">
            {Array.from({ length: ACHIEVEMENT_COUNT }, (_, i) => {
              const hasImage = tAbout(`achievements.items.${i}.image`) !== '';
              const listCountMap: Record<number, number> = { 0: 8 };
              const listCount = listCountMap[i] ?? 0;

              return (
                <FadeInSection key={i} delay={i * 100}>
                  <div className="group h-full overflow-hidden rounded-xl border border-ukraine-blue-100/60 bg-white transition-all duration-300 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/30 sm:rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-stretch">
                      {/* 图片/占位 */}
                      {hasImage ? (
                        <div className="relative h-48 overflow-hidden sm:h-auto sm:w-2/5 sm:min-h-[280px]">
                          <Image
                            src={tAbout(`achievements.items.${i}.image`)}
                            alt={tAbout(`achievements.items.${i}.title`)}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            sizes="(max-width: 768px) 100vw, 40vw"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-white/60 to-transparent sm:block" />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/60 to-transparent sm:hidden" />
                        </div>
                      ) : (
                        <div className={`relative flex h-48 items-center justify-center bg-gradient-to-br sm:h-auto sm:w-2/5 sm:min-h-[280px] ${ACHIEVEMENT_GRADIENTS[i]}`}>
                          <div className="opacity-25">{ACHIEVEMENT_ICONS[i]}</div>
                        </div>
                      )}

                      {/* 文字 */}
                      <div className="flex flex-1 flex-col justify-center px-4 py-5 sm:px-7 sm:py-7">
                        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-ukraine-blue-800 sm:text-xl">
                          {tAbout(`achievements.items.${i}.title`)}
                        </h3>
                        {tAbout(`achievements.items.${i}.text`).split('\n\n').map((paragraph, pi) => (
                          <p key={pi} className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                            {paragraph}
                          </p>
                        ))}
                        {listCount > 0 && (
                          <ul className="mt-3 grid grid-cols-1 gap-1 sm:mt-4 sm:grid-cols-2 sm:gap-1.5">
                            {Array.from({ length: listCount }, (_, li) => (
                              <li key={li} className="flex items-start gap-2 text-xs text-gray-600 sm:text-sm">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ukraine-blue-300" />
                                {tAbout(`achievements.items.${i}.list.${li}`)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 8. CTA ═══════════ */}
      <section className="px-3 py-16 sm:px-6 sm:py-24 lg:px-8">
        <FadeInSection>
          <div className="gradient-brand-full relative overflow-hidden rounded-2xl px-6 py-14 text-center sm:rounded-3xl sm:px-12 sm:py-20">
            {/* 装饰光晕 */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-20 blur-3xl glow-teal" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-15 blur-3xl glow-gold" />

            <div className="relative">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {t('cta.title')}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                {t('cta.text')}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Link
                  href="/donate"
                  className="inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-bold text-ukraine-blue-600 shadow-lg transition-all duration-300 hover:bg-ukraine-gold-50 hover:shadow-xl sm:px-10 sm:py-3.5 sm:text-base"
                >
                  {t('cta.donateButton')}
                </Link>
                <Link
                  href="/partners"
                  className="inline-flex items-center rounded-full border-2 border-white/40 px-8 py-3 text-sm font-bold text-white transition-all duration-300 hover:border-white hover:bg-white/10 sm:px-10 sm:py-3.5 sm:text-base"
                >
                  {t('cta.partnerButton')}
                </Link>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>
    </>
  );
}
