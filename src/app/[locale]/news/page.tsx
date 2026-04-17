import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { type Locale } from '@/i18n/config';
import { getAllNews } from '@/lib/news';
import NewsCard from '@/components/news/NewsCard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('newsTitle'),
    description: t('newsDescription'),
  };
}

export default async function NewsPage() {
  const tNav = await getTranslations('navigation');
  const tNews = await getTranslations('news');
  const locale = (await getLocale()) as Locale;
  const items = await getAllNews();

  return (
    <div className="container-page py-16 sm:py-24">
      <header className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="h-[2px] w-10 rounded-full bg-ukraine-gold-500" />
          <span className="font-[family-name:var(--font-data)] text-[11px] uppercase tracking-[0.32em] text-gray-500">
            {tNews('eyebrow')}
          </span>
        </div>

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1] tracking-[-0.02em] text-ukraine-blue-600 sm:text-5xl">
          {tNav('news')}
        </h1>

        <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-gray-500 sm:text-[15px]">
          {tNews('intro')}
        </p>
      </header>

      <section className="mx-auto mt-10 max-w-2xl space-y-4 sm:mt-12 sm:space-y-5">
        {items.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-white/60 px-10 py-16 text-center">
            <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ukraine-gold-500/40 to-transparent" />
            <div className="mx-auto h-[2px] w-6 rounded-full bg-ukraine-gold-500 opacity-60" />
            <p className="mt-4 font-[family-name:var(--font-data)] text-[11px] uppercase tracking-[0.26em] text-gray-400">
              {tNews('emptyEyebrow')}
            </p>
            <p className="mt-3 text-gray-500">{tNews('empty')}</p>
          </div>
        ) : (
          items.map((item, index) => (
            <NewsCard key={item.id} item={item} index={index} locale={locale} />
          ))
        )}
      </section>
    </div>
  );
}
