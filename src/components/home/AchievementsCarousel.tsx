import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import MobileAchievementsTabs, { type AchievementTab } from './MobileAchievementsTabs';

const ITEM_COUNT = 4;

// 图片真实尺寸（来自 public/images/achievement-*.webp）
const IMAGE_DIMENSIONS: Record<number, { width: number; height: number }> = {
  0: { width: 2000, height: 3000 }, // rehabilitation 2:3
  1: { width: 1280, height: 1438 }, // ambulance 近正方
  2: { width: 1400, height: 1050 }, // humanitarian 4:3 横
  3: { width: 1400, height: 1867 }, // international 3:4
};

// 桌面 2 列布局：左列承载 0/2，右列承载 1/3；列内用 flex-col + mt-auto 把第二张
// 卡 push 到底部，配合 grid 同行等高自动让两列底端齐平
const COLUMN_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 2],
  [1, 3],
];

type Stat = { value: string; label: string };

type AchievementItem = {
  title: string;
  meta: string;
  text: string;
  image: string;
  list?: string[];
  stats?: Stat[];
};

// 每个 entry 的 accent token —— 与 Values 三色呼应，第 4 项用暖色补齐
const ENTRY_ACCENT: { dot: string; eyebrow: string; line: string; soft: string }[] = [
  {
    dot: 'var(--color-ukraine-blue-500)',
    eyebrow: 'var(--color-ukraine-blue-600)',
    line: 'linear-gradient(90deg, var(--color-ukraine-blue-500), var(--color-ukraine-blue-200))',
    soft: 'color-mix(in srgb, var(--color-ukraine-blue-500) 8%, transparent)',
  },
  {
    dot: 'var(--color-ukraine-gold-600)',
    eyebrow: 'var(--color-ukraine-gold-700)',
    line: 'linear-gradient(90deg, var(--color-ukraine-gold-500), var(--color-ukraine-gold-200))',
    soft: 'color-mix(in srgb, var(--color-ukraine-gold-500) 12%, transparent)',
  },
  {
    dot: 'var(--color-life-500)',
    eyebrow: 'var(--color-life-500)',
    line: 'linear-gradient(90deg, var(--color-life-500), var(--color-ukraine-blue-200))',
    soft: 'color-mix(in srgb, var(--color-life-500) 10%, transparent)',
  },
  {
    dot: 'var(--color-warm-500)',
    eyebrow: 'var(--color-warm-500)',
    line: 'linear-gradient(90deg, var(--color-warm-500), var(--color-ukraine-gold-300))',
    soft: 'color-mix(in srgb, var(--color-warm-500) 10%, transparent)',
  },
];

function isStat(s: unknown): s is Stat {
  if (typeof s !== 'object' || s === null) return false;
  const o = s as Record<string, unknown>;
  return typeof o.value === 'string' && typeof o.label === 'string';
}

// 渲染单条 achievement 的内部内容（不含外层 <li> / <article> 包装），
// 这样既能给 sm+ 的 <ol> 用，又能给移动端 switcher panel 用
function renderInner(
  item: AchievementItem,
  i: number,
  accent: (typeof ENTRY_ACCENT)[number],
  dim: { width: number; height: number } | undefined,
) {
  const paragraphs = item.text.split('\n\n').filter(Boolean);

  return (
    <>
      {/* 图片 —— 真实比例展示 */}
      <figure className="relative">
        <div
          aria-hidden
          className="absolute -bottom-2 -right-2 -z-10 hidden h-full w-full rounded-2xl opacity-90 sm:-bottom-3 sm:-right-3 sm:block"
          style={{ background: accent.line }}
        />
        {item.image && dim ? (
          <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-ukraine-blue-100/70">
            <Image
              src={item.image}
              alt={item.title}
              width={dim.width}
              height={dim.height}
              className="h-auto w-full"
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
          </div>
        ) : (
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-ukraine-blue-50 ring-1 ring-ukraine-blue-100/70" />
        )}
      </figure>

      {/* meta badge —— eyebrow（4 张卡片共享结构，仅文本不同：数字 / 地点 / 合作方） */}
      {item.meta && (
        <div className="mt-5 flex items-center gap-2.5 sm:mt-6">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: accent.dot }}
          />
          <span
            className="font-[family-name:var(--font-data)] text-[0.7rem] font-medium uppercase tracking-[0.22em]"
            style={{ color: accent.eyebrow }}
          >
            {item.meta}
          </span>
        </div>
      )}

      {/* title */}
      <h4 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold leading-[1.2] text-ukraine-blue-800 sm:text-2xl">
        {item.title}
      </h4>

      {/* body —— 4 张卡片差异化样式 */}
      {i === 0 && (
        /* Card 0 · Recovery Support —— 数据 tag 型：
           - mobile / sm / md：chip 风格 flex-wrap，紧凑
           - lg+：切到竖排全宽 tinted 块（每行一项 + 大字号 + 大间距），
             把左列与右列高差吃掉，避免 mt-auto 留出过大空白 */
        <>
          <p className="mt-3 text-[0.92rem] leading-[1.6] text-gray-600">{item.text}</p>
          {item.list && (
            <ul className="mt-4 flex flex-wrap gap-1.5 lg:mt-4 lg:flex-col lg:flex-nowrap lg:gap-1">
              {item.list.map(li => (
                <li
                  key={li}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] font-medium leading-none lg:flex lg:w-full lg:gap-2.5 lg:rounded-md lg:px-3.5 lg:py-1.5 lg:text-[0.85rem] lg:leading-tight"
                  style={{ background: accent.soft, color: accent.eyebrow }}
                >
                  <span
                    aria-hidden
                    className="h-1 w-1 shrink-0 rounded-full"
                    style={{ background: accent.dot }}
                  />
                  {li}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {i === 1 &&
        /* Card 1 · Ambulance —— 叙事 lead 型：首段 italic + 略大字号 + 较深字色，
           后续段统一 body 字号；不混用衬线字体（PT Serif 仅做装饰性点缀） */
        paragraphs.map((para, pi) => (
          <p
            key={pi}
            className={
              pi === 0
                ? 'mt-3 text-[0.98rem] italic leading-[1.65] text-ukraine-blue-900 sm:mt-4 sm:text-[1.02rem]'
                : 'mt-3 text-[0.92rem] leading-[1.65] text-gray-600'
            }
          >
            {para}
          </p>
        ))}

      {i === 2 && (
        /* Card 2 · Humanitarian —— 行动分块型：双段独立 panel，左 accent bar + 软色背景 */
        <div className="mt-4 space-y-2.5">
          {paragraphs.map((para, pi) => (
            <div
              key={pi}
              className="rounded-r-lg border-l-[3px] py-2.5 pl-4 pr-3"
              style={{ borderColor: accent.dot, background: accent.soft }}
            >
              <p className="text-[0.9rem] leading-[1.55] text-gray-700">{para}</p>
            </div>
          ))}
        </div>
      )}

      {i === 3 && (
        /* Card 3 · International —— KPI 卡片型：italic lead + 2 个大数字 stat 块。
           lead 用默认 body 字体的 italic（不切到 PT Serif） */
        <>
          <p className="mt-3 text-[0.96rem] italic leading-[1.6] text-ukraine-blue-900 sm:mt-4 sm:text-[1rem]">
            {item.text}
          </p>
          {item.stats && (
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {item.stats.map(s => (
                <div
                  key={s.value}
                  className="rounded-lg p-3.5 ring-1 ring-ukraine-blue-100/70"
                  style={{ background: accent.soft }}
                >
                  <dt
                    className="font-[family-name:var(--font-data)] text-[1.75rem] font-bold leading-none sm:text-[2rem]"
                    style={{ color: accent.eyebrow }}
                  >
                    {s.value}
                  </dt>
                  <dd className="mt-2 text-[0.78rem] leading-snug text-gray-600">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </>
  );
}

export default async function AchievementsCarousel() {
  const t = await getTranslations('about.achievements');

  const items: AchievementItem[] = Array.from({ length: ITEM_COUNT }, (_, i) => {
    let list: string[] | undefined;
    if (t.has(`items.${i}.list`)) {
      const raw = t.raw(`items.${i}.list`);
      if (Array.isArray(raw)) list = raw.filter((x): x is string => typeof x === 'string');
    }
    let stats: Stat[] | undefined;
    if (t.has(`items.${i}.stats`)) {
      const raw = t.raw(`items.${i}.stats`);
      if (Array.isArray(raw)) stats = raw.filter(isStat);
    }
    return {
      title: t(`items.${i}.title`),
      meta: t.has(`items.${i}.meta`) ? t(`items.${i}.meta`) : '',
      text: t(`items.${i}.text`),
      image: t.has(`items.${i}.image`) ? t(`items.${i}.image`) : '',
      list,
      stats,
    };
  });

  // 移动端 tab：编号 + 标题，4 等分固定宽度
  const tabs: AchievementTab[] = items.map((item, i) => {
    const accent = ENTRY_ACCENT[i] ?? ENTRY_ACCENT[0];
    return {
      key: i,
      label: item.title,
      accent: { dot: accent.dot, eyebrow: accent.eyebrow, soft: accent.soft },
    };
  });

  return (
    <div className="mt-10 sm:mt-12">
      <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ukraine-blue-800 sm:text-2xl">
        {t('title')}
      </h3>
      <div className="mt-2 accent-line" />

      {/* 移动端：4 等分编号 tab + 单张当前卡片 */}
      <div className="mt-3 sm:hidden">
        <MobileAchievementsTabs tabs={tabs} ariaLabel={t('title')}>
          {items.map((item, i) => {
            const accent = ENTRY_ACCENT[i] ?? ENTRY_ACCENT[0];
            const dim = IMAGE_DIMENSIONS[i];
            return (
              <article key={i} className="pb-2">
                {renderInner(item, i, accent, dim)}
              </article>
            );
          })}
        </MobileAchievementsTabs>
      </div>

      {/* sm-lg：单列纵向堆叠 */}
      <div className="mt-6 hidden space-y-12 sm:mt-8 sm:block lg:hidden">
        {items.map((item, i) => {
          const accent = ENTRY_ACCENT[i] ?? ENTRY_ACCENT[0];
          const dim = IMAGE_DIMENSIONS[i];
          return (
            <article key={i}>
              {renderInner(item, i, accent, dim)}
            </article>
          );
        })}
      </div>

      {/* lg+：2 列 grid，每列内部 flex-col + 第二张卡 mt-auto 把底端推到对齐 */}
      <div className="mt-8 hidden lg:grid lg:grid-cols-2 lg:gap-x-10 xl:gap-x-12">
        {COLUMN_PAIRS.map(([top, bottom]) => {
          const topItem = items[top];
          const bottomItem = items[bottom];
          if (!topItem || !bottomItem) return null;
          const topAccent = ENTRY_ACCENT[top] ?? ENTRY_ACCENT[0];
          const bottomAccent = ENTRY_ACCENT[bottom] ?? ENTRY_ACCENT[0];
          const topDim = IMAGE_DIMENSIONS[top];
          const bottomDim = IMAGE_DIMENSIONS[bottom];
          return (
            <div key={top} className="flex flex-col">
              <article>{renderInner(topItem, top, topAccent, topDim)}</article>
              <article className="mt-auto pt-12">
                {renderInner(bottomItem, bottom, bottomAccent, bottomDim)}
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}
