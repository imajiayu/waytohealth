import { getTranslations, getLocale } from 'next-intl/server';
import { toLocale } from '@/i18n/config';
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
  const locale = toLocale(await getLocale());

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

      {/* 横向 snap 滚动 — CTA 固定在右侧,左侧卡片从它下方滚过并在接近时渐隐 */}
      <div className="container-page relative mt-2 sm:mt-3">
        {/* --cta-w 控制 CTA 固定区宽度,同时驱动滚动区右 padding 和 mask 渐隐位置 */}
        <div className="relative [--cta-w:180px] sm:[--cta-w:220px] lg:[--cta-w:260px]">
          {/* 滚动区 — mask 渐隐区间落在 CTA 覆盖区内(反正被 CTA 遮住看不见),
              让卡片右端能停在 mask 黑区末尾完整显示,又能在滑入 CTA 前自然淡出 */}
          <div className="hide-scrollbar mask-fade-right snap-x snap-proximity overflow-x-auto scroll-smooth pb-3 pt-3">
            <div className="flex items-stretch gap-5 sm:gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="w-[min(86vw,400px)] shrink-0 snap-start"
                >
                  <HomeDispatchCard item={item} locale={locale} />
                </div>
              ))}
              {/* spacer = CTA 宽度 — 撑开滚动宽度,让最后一张卡滚到最右时右端贴 CTA 左缘 */}
              <div
                aria-hidden
                className="shrink-0"
                style={{ width: 'var(--cta-w)' }}
              />
            </div>
          </div>

          {/* 固定 CTA — 始终在容器最右侧,卡片从其下方滚过 */}
          <div
            className="pointer-events-none absolute inset-y-3 right-0 z-10"
            style={{ width: 'var(--cta-w)' }}
          >
            <div className="pointer-events-auto h-full">
              <HomeDispatchCtaCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
