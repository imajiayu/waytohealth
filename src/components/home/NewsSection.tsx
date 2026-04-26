import { ArrowUpRight } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { toLocale } from '@/i18n/config';
import { getAllNews } from '@/lib/news';
import { Link } from '@/i18n/navigation';
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
    <section id="news" className="section-y relative scroll-mt-16 overflow-x-clip">
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
          <div className="mt-2 accent-line" />
        </div>
      </div>

      {/* sm+：CTA 固定在滚动区右侧,卡片从其下方滚过并在接近时渐隐
          mobile：CTA 变成滚动区下方的全宽按钮(--cta-w 未定义时 mask-fade-right 与 spacer 自动失效)
          sm:-mb-3 抵消 scroll container 的 pb-3 — pb-3 给 hover 阴影留呼吸,但视觉上是空白,
          不抵消会让 News→About section 间距比 Projects→News 多出 12px */}
      <div className="container-page relative sm:-mb-3">
        <div className="relative sm:[--cta-w:220px] lg:[--cta-w:260px]">
          <div className="hide-scrollbar mask-fade-right snap-x snap-proximity overflow-x-auto scroll-smooth pb-3 pt-2 sm:pt-3">
            <div className="flex items-stretch gap-5 sm:gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="w-[min(62vw,340px)] shrink-0 snap-start sm:w-[min(86vw,400px)]"
                >
                  <HomeDispatchCard item={item} locale={locale} />
                </div>
              ))}
              {/* spacer = CTA 宽度 — 撑开滚动宽度,让最后一张卡滚到最右时右端贴 CTA 左缘(mobile 无 CTA overlay,spacer 隐藏) */}
              <div
                aria-hidden
                className="hidden shrink-0 sm:block"
                style={{ width: 'var(--cta-w)' }}
              />
            </div>
          </div>

          {/* 固定 CTA(sm+) — 始终在容器最右侧,卡片从其下方滚过 */}
          <div
            className="pointer-events-none absolute inset-y-3 right-0 z-10 hidden sm:block"
            style={{ width: 'var(--cta-w)' }}
          >
            <div className="pointer-events-auto h-full">
              <HomeDispatchCtaCard />
            </div>
          </div>
        </div>

        {/* mobile CTA — 滚动区下方的全宽横条按钮,视觉延续 gradient-brand-deep + 金色箭头 */}
        <Link
          href="/news"
          className="group relative mt-1 flex items-center justify-between gap-3 overflow-hidden rounded-2xl gradient-brand-deep px-5 py-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-10px_rgba(0,108,178,0.5)] sm:hidden"
        >
          <div
            aria-hidden
            className="glow-gold pointer-events-none absolute -right-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full opacity-20 blur-2xl"
          />
          <span className="relative font-[family-name:var(--font-accent)] text-lg font-bold tracking-tight">
            {tNews('viewAll')}
          </span>
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ukraine-gold-500/80 text-ukraine-gold-400 transition-all duration-300 group-hover:border-ukraine-gold-500 group-hover:bg-ukraine-gold-500 group-hover:text-ukraine-navy">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </span>
        </Link>
      </div>
    </section>
  );
}
