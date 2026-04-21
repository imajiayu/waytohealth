'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { type Locale } from '@/i18n/config';
import { type NewsItem } from '@/data/news';

// 按需加载 lightbox：只有用户点图打开时才下载这块 ~4KB+ 的 client JS
const NewsLightbox = dynamic(() => import('./NewsLightbox'));

interface NewsCardProps {
  item: NewsItem;
  locale: Locale;    // 由父级显式传入（前台从 server component 取 locale，admin 从 composer 传 previewLocale）
  preview?: boolean; // 预览模式：关闭灯箱点击
  compact?: boolean; // 紧凑模式（首页横向滚动）：仅显示首图 + 正文 line-clamp + 标题 1 行
}

const MAX_GRID = 9;
const LOCALE_TAG: Record<Locale, string> = { ua: 'uk-UA', en: 'en-US' };

// 品牌名本地化 — 与 messages/<locale>.json::news.author 保持同步
// 放在此处而非通过 prop 传入,是因为 NewsCard 同时被 admin (无 i18n provider) 和前台使用
const AUTHOR_NAME: Record<Locale, string> = {
  ua: "Шлях до здоров'я",
  en: 'Way to Health',
};

// 图片点击按钮的 aria-label — 同上,admin 无 i18n provider,走本地表
const IMAGE_ARIA: Record<Locale, { viewAll: (n: number) => string; viewOne: (n: number) => string }> = {
  ua: {
    viewAll: (n) => `Переглянути всі ${n} зображень`,
    viewOne: (n) => `Переглянути зображення ${n}`,
  },
  en: {
    viewAll: (n) => `View all ${n} images`,
    viewOne: (n) => `View image ${n}`,
  },
};

function formatFeedDateTime(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const tag = LOCALE_TAG[locale];
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const datePart = new Intl.DateTimeFormat(tag, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(d);
  const timePart = new Intl.DateTimeFormat(tag, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
  return `${datePart} · ${timePart}`;
}

// 本地文件名、HTTP(S) URL（Vercel Blob）、blob: URL（admin 预览期的 ObjectURL）都要能正确显示
function resolveImageUrl(src: string): string {
  if (/^(https?:|blob:)/.test(src)) return src;
  return `/data/news/images/${src}`;
}

function isRemote(src: string): boolean {
  return /^(https?:|blob:)/.test(src);
}

function gridWrapperClass(n: number): string {
  if (n === 1) return 'grid grid-cols-1';
  if (n === 2) return 'grid grid-cols-2';
  if (n === 3) return 'grid grid-cols-3 grid-rows-2 aspect-[3/2]';
  if (n === 4) return 'grid grid-cols-2';
  return 'grid grid-cols-3';
}

function cellClass(n: number, i: number): string {
  const base = 'relative overflow-hidden bg-ukraine-blue-50';
  if (n === 1) return `${base} aspect-[16/10]`;
  if (n === 3 && i === 0) return `${base} col-span-2 row-span-2`;
  return `${base} aspect-square`;
}

export default function NewsCard({ item, locale, preview = false, compact = false }: NewsCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const title = item.title[locale];
  const body = item.body[locale];
  const iso = new Date(item.published_at).toISOString();
  const dateLabel = formatFeedDateTime(item.published_at, locale);
  const authorName = AUTHOR_NAME[locale];
  const allImages = item.images ?? [];
  // compact: 首图作为 hero，剩余数用 +N 角标；feed: 最多 9 张网格 + 末格 +N 蒙版
  const gridMax = compact ? 1 : MAX_GRID;
  const shown = allImages.slice(0, gridMax);
  const overflow = Math.max(0, allImages.length - gridMax);

  return (
    <>
      <article className="relative">
        <div
          className={
            preview
              ? 'relative rounded-2xl border border-gray-200/70 bg-white'
              : 'relative rounded-2xl border border-gray-200/70 bg-white transition-all duration-300 hover:border-gray-300/70 hover:shadow-[0_14px_36px_-18px_rgba(0,108,178,0.18)]'
          }
        >
          <div className="flex gap-3 p-4 sm:gap-3.5 sm:p-5">
            {/* Favicon 头像 */}
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-gray-200/80">
              <Image
                src="/favicon.svg"
                alt=""
                fill
                sizes="40px"
                className="object-contain p-[3px]"
              />
            </div>

            {/* 右侧内容 */}
            <div className="min-w-0 flex-1">
              {/* 署名 + 日期 */}
              <div className="flex flex-wrap items-center gap-x-1.5 text-[14px] leading-snug sm:text-[15px]">
                <span className="font-bold text-gray-900">{authorName}</span>
                <span className="text-gray-400" aria-hidden>·</span>
                <time dateTime={iso} className="text-gray-500">
                  {dateLabel}
                </time>
              </div>

              {/* 标题（可选） */}
              {title && (
                <h2 className={`mt-0.5 text-[15px] font-semibold leading-snug tracking-[-0.005em] text-gray-900 sm:text-[16px] ${compact ? 'line-clamp-1' : ''}`}>
                  {title}
                </h2>
              )}

              {/* 正文 */}
              <p className={`mt-0.5 whitespace-pre-wrap text-[15px] leading-[1.45] text-gray-800 ${compact ? 'line-clamp-3' : ''}`}>
                {body}
              </p>

              {/* 图片网格 */}
              {shown.length > 0 && (
                <div className={`mt-3 gap-[3px] overflow-hidden rounded-2xl border border-gray-200/60 ${gridWrapperClass(shown.length)}`}>
                  {shown.map((src, i) => {
                    const isLastWithOverflow = i === gridMax - 1 && overflow > 0;
                    const CellImage = (
                      <>
                        <Image
                          src={resolveImageUrl(src)}
                          alt={title || 'News image'}
                          fill
                          sizes="(max-width: 640px) 100vw, 560px"
                          unoptimized={isRemote(src)}
                          className={
                            preview
                              ? 'object-cover'
                              : 'object-cover transition-transform duration-500 ease-out group-hover/cell:scale-[1.03]'
                          }
                        />
                        {isLastWithOverflow && (
                          compact ? (
                            // compact 模式：首图作为封面，右下角贴 +N 胶囊，不遮挡图
                            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-ukraine-navy/80 px-2.5 py-1 font-[family-name:var(--font-data)] text-[11px] font-semibold text-white backdrop-blur-sm">
                              +{overflow}
                            </span>
                          ) : (
                            // feed 模式：末格整屏蒙版"+N"
                            <div className="absolute inset-0 flex items-center justify-center bg-ukraine-navy/70 backdrop-blur-[1px]">
                              <span className="font-[family-name:var(--font-display)] text-3xl font-bold leading-none text-white sm:text-4xl">
                                +{overflow}
                              </span>
                            </div>
                          )
                        )}
                      </>
                    );

                    return preview ? (
                      <div key={`${src}-${i}`} className={cellClass(shown.length, i)}>
                        {CellImage}
                      </div>
                    ) : (
                      <button
                        key={`${src}-${i}`}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        aria-label={isLastWithOverflow ? IMAGE_ARIA[locale].viewAll(allImages.length) : IMAGE_ARIA[locale].viewOne(i + 1)}
                        className={`group/cell cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ukraine-gold-500 ${cellClass(shown.length, i)}`}
                      >
                        {CellImage}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      {!preview && lightboxIndex !== null && allImages.length > 0 && (
        <NewsLightbox
          images={allImages}
          startIndex={lightboxIndex}
          alt={title || 'News image'}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
