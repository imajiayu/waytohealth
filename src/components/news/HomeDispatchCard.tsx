import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { type NewsItem } from '@/data/news';

interface HomeDispatchCardProps {
  item: NewsItem;
  locale: Locale;
}

const LOCALE_TAG: Record<Locale, string> = { ua: 'uk-UA', en: 'en-US' };

function resolveImg(src: string): string {
  if (/^(https?:|blob:)/.test(src)) return src;
  return `/data/news/images/${src}`;
}

function isRemote(src: string): boolean {
  return /^(https?:|blob:)/.test(src);
}

export default async function HomeDispatchCard({ item, locale }: HomeDispatchCardProps) {
  const t = await getTranslations('news');
  const title = item.title[locale];
  const body = item.body[locale];
  const d = new Date(item.published_at);
  const tag = LOCALE_TAG[locale];
  // 月份短名统一大写并去掉尾点（uk-UA 会输出 "квіт." 带点）
  const monthShort = new Intl.DateTimeFormat(tag, { month: 'short' })
    .format(d)
    .replace('.', '')
    .toUpperCase();
  const day = new Intl.DateTimeFormat(tag, { day: '2-digit' }).format(d);
  const cover = item.images?.[0];
  const extras = (item.images?.length ?? 0) - 1;

  return (
    <Link
      href="/news"
      aria-label={title || 'Dispatch'}
      className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-gray-200/60 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-0.5 hover:border-gray-300/70 hover:shadow-[0_10px_24px_-12px_rgba(0,108,178,0.25)]"
    >
      {/* Hero 图区 — 横向 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden bg-ukraine-blue-50">
        {cover ? (
          <Image
            src={resolveImg(cover)}
            alt=""
            fill
            sizes="(max-width: 640px) 86vw, 340px"
            unoptimized={isRemote(cover)}
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 gradient-brand-full opacity-90" />
        )}

        {/* 底部蒙版为印章文字让路 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ukraine-navy/92 via-ukraine-navy/48 to-transparent"
        />

        {/* 右上:多图角标 */}
        {extras > 0 && (
          <div className="absolute right-4 top-4 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
            +{extras}
          </div>
        )}

        {/* 底部日期印章 */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          {/* 细金线 */}
          <div aria-hidden className="mb-3 h-px w-full bg-gradient-to-r from-ukraine-gold-500/70 via-white/25 to-transparent" />

          <div className="flex items-baseline justify-end gap-1.5 text-white">
            <span className="font-[family-name:var(--font-accent)] text-[2.1rem] font-bold leading-[0.85] tracking-[-0.02em]">
              {day}
            </span>
            <span className="font-[family-name:var(--font-data)] text-[9.5px] font-semibold uppercase tracking-[0.22em] text-ukraine-gold-300">
              {monthShort}
            </span>
          </div>
        </div>
      </div>

      {/* 文字区 */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        {title && (
          <h3 className="font-[family-name:var(--font-display)] text-[16px] font-bold leading-[1.28] tracking-[-0.01em] text-gray-900 line-clamp-2 sm:text-[17px]">
            {title}
          </h3>
        )}

        <p className="mt-2 text-[13.5px] leading-[1.55] text-gray-500 line-clamp-3">
          {body}
        </p>

        {/* Read on 行 */}
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="relative font-[family-name:var(--font-data)] text-[10.5px] font-semibold uppercase tracking-[0.26em] text-gray-400 transition-colors duration-300 group-hover:text-ukraine-blue-600">
            {t('readOn')}
            <span aria-hidden className="absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-ukraine-gold-500 transition-[width] duration-500 group-hover:w-full" />
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ukraine-blue-50 text-ukraine-blue-600 transition-all duration-300 group-hover:-rotate-6 group-hover:bg-ukraine-gold-500 group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </div>
        </div>
      </div>
    </Link>
  );
}
