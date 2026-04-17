import { getTranslations, getLocale } from 'next-intl/server';
import { type Locale } from '@/i18n/config';
import { getAllNews } from '@/lib/news';
import HomeDispatchCard from '@/components/news/HomeDispatchCard';
import HomeDispatchCtaCard from '@/components/news/HomeDispatchCtaCard';

// 首页最多展示 N 条最新,超出部分进 /news 瀑布流页
const HOME_LIMIT = 6;

export default async function NewsSection() {
  const [tNews, tNav, all] = await Promise.all([
    getTranslations('news'),
    getTranslations('navigation'),
    getAllNews(),
  ]);
  const locale = (await getLocale()) as Locale;

  if (all.length === 0) return null;

  const items = all.slice(0, HOME_LIMIT);

  return (
    <section id="news" className="relative scroll-mt-16 overflow-x-clip pt-6 sm:pt-8">
      {/* 背景装饰 — 冷色光源从左上,金色从右下,避开 Projects 的右上主光源 */}
      <div className="aura-teal-md pointer-events-none absolute -left-40 -top-24 h-[620px] w-[620px] rounded-full opacity-55 blur-3xl" />
      <div className="aura-gold-lg pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full opacity-35 blur-3xl" />

      <div className="container-page relative">
        {/* Section header — 编辑式,与 Projects section 对齐 */}
        <div>
          <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
            {tNav('news')}
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
            {tNews('sectionTitle')}
          </h2>
          <div className="mt-3 accent-line" />
        </div>
      </div>

      {/* 横向 snap 滚动 — 与 container-page 对齐,避免宽屏下卡片跑到视口最左 */}
      <div className="container-page relative mt-2 sm:mt-3">
        {/* py/px 给卡片 hover 上浮 + 阴影留出空间,否则会被 overflow 裁切 */}
        <div className="hide-scrollbar -mx-3 snap-x snap-mandatory overflow-x-auto scroll-smooth px-3 pb-3 pt-3">
          <div className="flex items-stretch gap-5 sm:gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="w-[min(86vw,400px)] shrink-0 snap-start"
              >
                <HomeDispatchCard item={item} locale={locale} />
              </div>
            ))}

            {/* 末尾:深色 CTA 卡 — 比明信片窄一号,尾注感 */}
            <div className="w-[min(70vw,260px)] shrink-0 snap-end">
              <HomeDispatchCtaCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
