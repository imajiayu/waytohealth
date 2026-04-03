import { getTranslations } from 'next-intl/server';

const VALUE_KEYS = ['transparency', 'speed', 'result'] as const;

const VALUE_ICONS: Record<string, React.ReactNode> = {
  transparency: (
    <svg viewBox="0 0 28 28" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="14" r="5" />
      <path d="M2 14s4.5-8 12-8 12 8 12 8-4.5 8-12 8-12-8-12-8z" />
    </svg>
  ),
  speed: (
    <svg viewBox="0 0 28 28" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2L5 16h8l-2 10 10-14h-8z" />
    </svg>
  ),
  result: (
    <svg viewBox="0 0 28 28" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="14" r="11" />
      <circle cx="14" cy="14" r="7" />
      <circle cx="14" cy="14" r="3" />
    </svg>
  ),
};

const VALUE_ACCENTS: Record<string, string> = {
  transparency: 'from-ukraine-blue-400 to-ukraine-blue-200',
  speed: 'from-ukraine-gold-500 to-ukraine-gold-300',
  result: 'from-life-500 to-ukraine-blue-300',
};

export default async function ValuesAccordion() {
  const t = await getTranslations('about.values');

  return (
    <div className="mt-10 sm:mt-16">
      <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ukraine-blue-800 sm:text-2xl">
        {t('title')}
      </h3>
      <div className="mt-2 accent-line" />

      <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-3">
        {VALUE_KEYS.map(key => (
          <div
            key={key}
            className="group relative overflow-hidden rounded-xl border border-ukraine-blue-100/60 bg-white p-5 transition-all duration-300 hover:border-ukraine-blue-200 hover:shadow-lg hover:shadow-ukraine-blue-100/40 sm:rounded-2xl sm:p-8"
          >
            {/* 顶部渐变条 */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${VALUE_ACCENTS[key]} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

            <div className="mb-4 text-ukraine-blue-300 transition-colors duration-300 group-hover:text-ukraine-blue-500">
              {VALUE_ICONS[key]}
            </div>

            <h4 className="font-[family-name:var(--font-display)] text-lg font-bold text-ukraine-blue-800">
              {t(`${key}.name`)}
            </h4>

            <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              {t(`${key}.text`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
