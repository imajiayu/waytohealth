'use client';

import { useState, type ReactNode } from 'react';
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
  }).format(d);
  return `${datePart} · ${timePart}`;
}

// 本地文件名、HTTP(S) URL（Vercel Blob）、blob: URL（admin 预览期的 ObjectURL）都要能正确显示
function resolveImageUrl(src: string): string {
  if (/^(https?:|blob:)/.test(src)) return src;
  return `/data/news/images/${src}`;
}

// blob: (admin 预览的 ObjectURL) 必须绕过 next/image；
// https: (Vercel Blob) 在前台 feed 里必须走优化管线，否则会直接加载 iPhone 原图
// （数 MB / 4000+ 像素宽），导致列表滚动反复解码大图而卡顿。
// 注：admin preview (preview=true) 场景下也会整体 unoptimized —— 见 Image 的 unoptimized 表达式，
// 那里 OR 上 preview，理由是预览只渲染一条，避开 dev 环境 /_next/image 对远程 Blob URL 的超时
function isBlobUrl(src: string): boolean {
  return src.startsWith('blob:');
}

// 把正文里的 http/https URL 渲染成可点击的 <a>，其它片段保持原样（包括 \n，交给 whitespace-pre-wrap）
// 尾随的句读（.,;:!?) 等）不算入 URL，避免把句号吞进链接
function linkifyBody(text: string): ReactNode[] {
  const matches = Array.from(text.matchAll(/https?:\/\/[^\s<>"']+/g));
  if (matches.length === 0) return [text];
  const out: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    const start = m.index ?? 0;
    let url = m[0];
    const trail = url.match(/[.,;:!?)\]}>'"]+$/);
    const trailing = trail ? trail[0] : '';
    if (trailing) url = url.slice(0, -trailing.length);
    if (start > cursor) out.push(text.slice(cursor, start));
    out.push(
      <a
        key={`lnk-${i}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-words text-ukraine-blue-600 underline decoration-ukraine-blue-600/40 underline-offset-2 hover:decoration-ukraine-blue-600"
      >
        {url}
      </a>,
    );
    if (trailing) out.push(trailing);
    cursor = start + m[0].length;
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
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
          <div className="flex gap-2.5 p-3.5 sm:gap-3.5 sm:p-5">
            {/* Favicon 头像 */}
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-gray-200/80 sm:h-10 sm:w-10">
              <Image
                src="/favicon.svg"
                alt=""
                fill
                sizes="(max-width: 640px) 36px, 40px"
                className="object-contain p-[3px]"
              />
            </div>

            {/* 右侧内容 */}
            <div className="min-w-0 flex-1">
              {/* 署名 + 日期 */}
              <div className="flex min-w-0 items-center gap-x-1.5 text-[13.5px] leading-snug sm:text-[15px]">
                <span className="truncate font-bold text-gray-900">{authorName}</span>
                <span className="shrink-0 text-gray-400" aria-hidden>·</span>
                <time dateTime={iso} className="shrink-0 whitespace-nowrap text-gray-500">
                  {dateLabel}
                </time>
              </div>

              {/* Tags — 独立一行，避免在窄屏上被挤进作者行 */}
              {!compact && item.tags && item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-1.5 sm:gap-2">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.en}
                      className="rounded-full bg-ukraine-blue-50 px-2 py-0.5 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.12em] text-ukraine-blue-500 sm:px-2.5 sm:tracking-[0.15em]"
                    >
                      {tag[locale]}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 sm:px-2.5 sm:tracking-[0.15em]">
                      +{item.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* 标题（可选） */}
              {title && (
                <h2 className={`mt-2 text-[15px] font-semibold leading-snug tracking-[-0.005em] text-gray-900 sm:mt-1.5 sm:text-[16px] ${compact ? 'line-clamp-1' : ''}`}>
                  {title}
                </h2>
              )}

              {/* 正文 */}
              <p className={`mt-1 whitespace-pre-wrap text-[15px] leading-[1.45] text-gray-800 sm:mt-0.5 ${compact ? 'line-clamp-3' : ''}`}>
                {linkifyBody(body)}
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
                          unoptimized={isBlobUrl(src) || preview}
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
