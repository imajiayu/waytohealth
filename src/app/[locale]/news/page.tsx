import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { toLocale } from '@/i18n/config';
import { buildAlternates, buildOpenGraph, buildTwitter } from '@/lib/seo';
import { getAllNews } from '@/lib/news';
import { type Tag } from '@/data/news';
import NewsCard from '@/components/news/NewsCard';
import TagFilterBar, { type TagWithCount } from '@/components/news/TagFilterBar';

export async function generateMetadata(): Promise<Metadata> {
  const locale = toLocale(await getLocale());
  const t = await getTranslations('metadata');
  const title = t('newsTitle');
  const description = t('newsDescription');
  return {
    title,
    description,
    alternates: buildAlternates(locale, '/news'),
    openGraph: buildOpenGraph({ title, description, locale, path: '/news' }),
    twitter: buildTwitter({ title, description }),
  };
}

interface PageProps {
  searchParams: Promise<{ tag?: string | string[] }>;
}

export default async function NewsPage({ searchParams }: PageProps) {
  const tNav = await getTranslations('navigation');
  const tNews = await getTranslations('news');
  const locale = toLocale(await getLocale());
  const items = await getAllNews();

  const { tag: rawTag } = await searchParams;
  // ?tag=a&tag=b 时 Next.js 会给 string[]，取第一个即可
  const tagStr = Array.isArray(rawTag) ? rawTag[0] : rawTag;
  const activeTag = tagStr ? tagStr.toLowerCase() : null;

  // 聚合所有 tag 的并集（按 en 小写去重 + 计数排序）
  const tagCountMap = new Map<string, TagWithCount>();
  for (const it of items) {
    for (const t of it.tags ?? []) {
      const key = t.en.toLowerCase();
      const cur = tagCountMap.get(key);
      if (cur) cur.count++;
      else tagCountMap.set(key, { ua: t.ua, en: t.en, count: 1 });
    }
  }
  const allTags = Array.from(tagCountMap.values()).sort((a, b) => b.count - a.count);
  const hasAnyTags = allTags.length > 0;

  // 过滤
  const filtered: typeof items = activeTag
    ? items.filter((it) => (it.tags ?? []).some((t: Tag) => t.en.toLowerCase() === activeTag))
    : items;

  const activeTagInUnion = activeTag !== null && tagCountMap.has(activeTag);
  // 未知 slug（不在并集内）直接退化为"无过滤"，避免 UI 上 All 高亮又显示空态的矛盾
  const showEmptyFilter = activeTagInUnion && filtered.length === 0;

  // 两栏 grid 的断点：lg 以上双栏，以下回到单列 + 顶部 chips
  return (
    <div className="container-page section-y">
      <header className="mx-auto max-w-5xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1] tracking-[-0.02em] text-ukraine-blue-600 sm:text-5xl">
          {tNav('news')}
        </h1>

        <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-gray-500 sm:text-[15px]">
          {tNews('intro')}
        </p>
      </header>

      <div
        className={`mx-auto mt-8 max-w-5xl gap-x-12 gap-y-6 sm:mt-10 ${
          hasAnyTags ? 'grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-x-16' : ''
        }`}
      >
        {/* 左：sticky rail（桌面） / 顶部 chips（移动）— 组件内部响应式切换 */}
        <TagFilterBar
          tags={allTags}
          activeTag={activeTagInUnion ? activeTag : null}
          locale={locale}
          allLabel={tNews('tags.all')}
          filterLabel={tNews('tags.filterLabel')}
          totalCount={items.length}
        />

        {/* 右：feed 主列，保留 Twitter 风宽度 */}
        <section className={`${hasAnyTags ? '' : 'mx-auto'} max-w-2xl space-y-4 sm:space-y-5`}>
          {items.length === 0 ? (
            <EmptyState eyebrow={tNews('emptyEyebrow')} message={tNews('empty')} />
          ) : showEmptyFilter ? (
            <EmptyState eyebrow={tNews('emptyEyebrow')} message={tNews('tags.emptyFilter')} />
          ) : (
            filtered.map((item) => (
              <NewsCard key={item.id} item={item} locale={locale} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyState({ eyebrow, message }: { eyebrow: string; message: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-white/60 px-10 py-16 text-center">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ukraine-gold-500/40 to-transparent" />
      <div className="mx-auto h-[2px] w-6 rounded-full bg-ukraine-gold-500 opacity-60" />
      <p className="mt-4 font-[family-name:var(--font-data)] text-[11px] uppercase tracking-[0.26em] text-gray-400">
        {eyebrow}
      </p>
      <p className="mt-3 text-gray-500">{message}</p>
    </div>
  );
}
