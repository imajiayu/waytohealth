import { getTranslations } from 'next-intl/server';
import MobileTabSwitcher, { type MobileTabItem } from './MobileTabSwitcher';

const VALUE_KEYS = ['transparency', 'speed', 'result'] as const;

type ValueKey = (typeof VALUE_KEYS)[number];

// 每个 value 的 accent token —— 用 inline CSS variable 驱动，避免 Tailwind 动态类名陷阱
const VALUE_ACCENT: Record<ValueKey, { bar: string; dot: string; line: string }> = {
  transparency: {
    bar: 'linear-gradient(to bottom, var(--color-ukraine-blue-500), var(--color-ukraine-blue-200))',
    dot: 'var(--color-ukraine-blue-500)',
    line: 'linear-gradient(90deg, var(--color-ukraine-blue-500), var(--color-ukraine-blue-200))',
  },
  speed: {
    bar: 'linear-gradient(to bottom, var(--color-ukraine-gold-500), var(--color-ukraine-gold-200))',
    dot: 'var(--color-ukraine-gold-500)',
    line: 'linear-gradient(90deg, var(--color-ukraine-gold-500), var(--color-ukraine-gold-200))',
  },
  result: {
    bar: 'linear-gradient(to bottom, var(--color-life-500), var(--color-ukraine-blue-200))',
    dot: 'var(--color-life-500)',
    line: 'linear-gradient(90deg, var(--color-life-500), var(--color-ukraine-blue-200))',
  },
};

export default async function ValuesAccordion() {
  const t = await getTranslations('about.values');

  // sm+ 多列网格用的 article：含 h4 标题 + dot + body
  const desktopArticles = VALUE_KEYS.map(key => {
    const accent = VALUE_ACCENT[key];
    return (
      <article key={key} className="group relative pl-5">
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px] rounded-full"
          style={{ background: accent.bar }}
        />

        <h4 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold text-ukraine-blue-800 sm:text-xl">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: accent.dot }}
          />
          {t(`${key}.name`)}
        </h4>

        <p className="mt-3 text-[0.92rem] leading-[1.65] text-gray-600 sm:text-[0.95rem]">
          {t(`${key}.text`)}
        </p>
      </article>
    );
  });

  // 移动端 panel article：去掉 h4 标题（tab 已经标注），只留左 accent bar + body
  const mobileArticles = VALUE_KEYS.map(key => {
    const accent = VALUE_ACCENT[key];
    return (
      <article key={key} className="relative pl-5 pt-1">
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px] rounded-full"
          style={{ background: accent.bar }}
        />
        <p className="text-[0.95rem] leading-[1.65] text-gray-600">
          {t(`${key}.text`)}
        </p>
      </article>
    );
  });

  // 移动端 tab card：纯文字矩形卡 —— 软色背景 + 居中粗体文字（值名）
  const tabs: MobileTabItem[] = VALUE_KEYS.map(key => {
    const accent = VALUE_ACCENT[key];
    return {
      key,
      label: t(`${key}.name`),
      activeAccent: accent.dot,
      thumbnail: (
        <div
          className="flex h-[64px] w-full items-center justify-center px-3 text-center"
          style={{
            background: `color-mix(in srgb, ${accent.dot} 12%, transparent)`,
          }}
        >
          {/* 字号统一放大；最长的 "Transparency" 在 ~390px 屏宽下仍与左右 px-3 留 padding，
              更窄屏会优雅折行（h-[64px] 装得下两行 14px 文字） */}
          <span className="text-[14px] font-semibold leading-[1.15] tracking-tight text-ukraine-blue-900">
            {t(`${key}.name`)}
          </span>
        </div>
      ),
    };
  });

  return (
    <div className="mt-10 sm:mt-12">
      <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ukraine-blue-800 sm:text-2xl">
        {t('title')}
      </h3>
      <div className="mt-2 accent-line" />

      {/* 移动端：纯文字矩形卡 tab + 单段正文（折叠纵向高度） */}
      <div className="mt-3 sm:hidden">
        <MobileTabSwitcher
          tabs={tabs}
          ariaLabel={t('title')}
          variant="card"
        >
          {mobileArticles}
        </MobileTabSwitcher>
      </div>

      {/* sm+：原 1-col / lg 3-col 网格 —— 复用 AboutSection mission/vision 的左 accent bar 语汇 */}
      <div className="mt-5 hidden gap-x-8 gap-y-7 sm:mt-6 sm:grid sm:grid-cols-1 sm:gap-x-10 lg:grid-cols-3">
        {desktopArticles}
      </div>
    </div>
  );
}
