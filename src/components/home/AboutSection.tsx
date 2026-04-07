import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import ValuesAccordion from './ValuesAccordion';
import AchievementsCarousel from './AchievementsCarousel';

const STAT_KEYS = ['years', 'patients', 'funds', 'partners'] as const;

const STAT_ICONS: Record<string, React.ReactNode> = {
  years: (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="16" cy="16" r="12" />
      <path d="M16 10v7l4.5 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  patients: (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 4C9.4 4 4 9 4 15c0 4.1 2.3 7.7 5.7 9.6L16 28l6.3-3.4C25.7 22.7 28 19.1 28 15c0-6-5.4-11-12-11z" />
      <path d="M12 15h8M16 11v8" strokeLinecap="round" />
    </svg>
  ),
  funds: (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 24V12l10-6 10 6v12l-10 6z" />
      <path d="M6 12l10 6m0 0l10-6m-10 6v12" opacity="0.4" />
    </svg>
  ),
  partners: (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="12" r="4" />
      <circle cx="21" cy="12" r="4" />
      <path d="M4 26c0-4 3.1-7 7-7 1.5 0 2.9.5 4 1.2a7.2 7.2 0 0 1 5-1.2c3.9 0 7 3 7 7" strokeLinecap="round" />
    </svg>
  ),
};

export default async function AboutSection() {
  const [t, tNav] = await Promise.all([
    getTranslations('about'),
    getTranslations('navigation'),
  ]);

  return (
    <section id="about" className="section-y relative scroll-mt-16 overflow-hidden">
      {/* 背景装饰 — 右下主光晕(品牌青绿,主光源) */}
      <div className="aura-teal-md pointer-events-none absolute -right-40 -bottom-40 h-[600px] w-[600px] rounded-full opacity-90 blur-3xl" />
      {/* 背景装饰 — 左下温暖金光(与 ProjectsSection 左下蓝光形成对位) */}
      <div className="aura-gold-lg pointer-events-none absolute -left-32 bottom-24 h-[460px] w-[460px] rounded-full opacity-80 blur-3xl" />
      {/* 背景装饰 — 左上次光晕(微金,平衡上方) */}
      <div className="aura-gold-lg pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full opacity-50 blur-3xl" />
      {/* 背景装饰 — 右上点阵(精密感) */}
      <div
        className="pointer-events-none absolute right-[5%] top-16 hidden h-40 w-40 opacity-[0.22] lg:block"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--color-ukraine-blue-300) 1px, transparent 1.5px)',
          backgroundSize: '14px 14px',
        }}
      />

      <div className="container-page relative">
        {/* 区域标签 + 标题 */}
        <div>
          <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
            {tNav('about')}
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
            {t('title')}
          </h2>
          <div className="mt-3 accent-line" />
        </div>

        {/* 照片 + 数据卡片 + 使命/愿景 — 两列布局 */}
        <div className="mt-2 grid items-stretch gap-8 sm:mt-3 sm:gap-12 lg:grid-cols-2">
          {/* 左侧：照片（高度撑满右列） */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
            {/* 装饰色块 — 照片后方向左下偏移，呼应左下金光的视觉重心 */}
            <div className="absolute -bottom-4 -left-4 h-full w-full rounded-2xl gradient-brand opacity-10" />
            <div className="relative h-full overflow-hidden rounded-2xl">
              <Image
                src="/images/about-team.jpg"
                alt={t('title')}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* 底部渐变遮罩 — 增加层次感 */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>

          {/* 右侧：2x2 数据卡片 + 使命 + 愿景 */}
          <div className="flex flex-col gap-8 sm:gap-10">
            {/* 2x2 统计数据网格 */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {STAT_KEYS.map((key, i) => (
                <div
                  key={key}
                  className="group relative rounded-xl border border-ukraine-blue-100/60 bg-white p-4 transition-all duration-300 hover:border-ukraine-blue-200 hover:shadow-lg hover:shadow-ukraine-blue-100/40 sm:rounded-2xl sm:p-6"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className="mb-2 text-ukraine-blue-300 transition-colors duration-300 group-hover:text-ukraine-blue-500 sm:mb-3">
                    {STAT_ICONS[key]}
                  </div>
                  <div className="font-[family-name:var(--font-data)] text-2xl font-bold tracking-tight text-ukraine-blue-700 sm:text-3xl lg:text-[2rem]">
                    {t(`stats.${key}.value`)}
                  </div>
                  {key === 'funds' && (
                    <span className="mt-1 block font-[family-name:var(--font-data)] text-xs font-medium text-ukraine-blue-400">
                      {t('stats.funds.unit')}
                    </span>
                  )}
                  <p className="mt-2 text-sm leading-snug text-gray-500">
                    {t(`stats.${key}.label`)}
                  </p>
                  <div className="absolute bottom-0 left-4 right-4 h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-500 group-hover:scale-x-100 gradient-brand-line" />
                </div>
              ))}
            </div>

            {/* 使命 */}
            <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-ukraine-blue-400 before:to-ukraine-blue-200">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ukraine-blue-800 sm:text-2xl">
                {t('mission.title')}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-600 sm:text-lg">
                {t('mission.text')}
              </p>
            </div>

            {/* 愿景 */}
            <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-ukraine-gold-400 before:to-ukraine-gold-200">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ukraine-blue-800 sm:text-2xl">
                {t('vision.title')}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-600 sm:text-lg">
                {t('vision.text')}
              </p>
            </div>

          </div>
        </div>

        {/* 价值观 */}
        <ValuesAccordion />

        {/* 已完成项目横滑 */}
        <AchievementsCarousel />

        {/* CTA */}
        <div className="mt-10 flex sm:mt-12">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full border-2 border-ukraine-blue-500 px-6 py-2.5 text-sm font-semibold text-ukraine-blue-600 transition-all duration-300 hover:bg-ukraine-blue-500 hover:text-white hover:shadow-lg hover:shadow-ukraine-blue-200/50 sm:px-7 sm:py-3"
          >
            {t('cta')}
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
