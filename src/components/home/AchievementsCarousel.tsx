'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const ITEM_COUNT = 4;

/* 无图片时的占位渐变 + 图标 */
const PLACEHOLDERS: { gradient: string; icon: React.ReactNode }[] = [
  { gradient: '', icon: null },
  {
    gradient: 'from-warm-500 to-ukraine-gold-400',
    icon: (
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="26" width="44" height="20" rx="5" />
        <circle cx="20" cy="46" r="5" />
        <circle cx="44" cy="46" r="5" />
        <path d="M16 26l5-10h22l5 10" />
      </svg>
    ),
  },
  {
    gradient: 'from-life-500 to-ukraine-blue-300',
    icon: (
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 6L8 18v28l24 12 24-12V18z" />
        <path d="M8 18l24 12m0 0l24-12m-24 12v24" opacity="0.4" />
      </svg>
    ),
  },
  {
    gradient: 'from-ukraine-gold-500 to-ukraine-blue-400',
    icon: (
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="22" cy="22" r="10" />
        <circle cx="42" cy="22" r="10" />
        <circle cx="32" cy="42" r="10" />
      </svg>
    ),
  },
];

export default function AchievementsCarousel() {
  const t = useTranslations('about.achievements');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ left: false, right: true });

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
    setScrollState(prev => (prev.left === left && prev.right === right) ? prev : { left, right });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(':scope > *')?.offsetWidth ?? 600;
    el.scrollBy({ left: direction === 'left' ? -cardWidth - 32 : cardWidth + 32, behavior: 'smooth' });
  };

  const items = Array.from({ length: ITEM_COUNT }, (_, i) => {
    const hasImage = t(`items.${i}.image`) !== '';
    return {
      title: t(`items.${i}.title`),
      text: t(`items.${i}.text`),
      image: hasImage ? t(`items.${i}.image`) : '',
      listCount: i === 0 ? 8 : 0,
    };
  });

  return (
    <div className="mt-10 sm:mt-16">
      {/* 标题行 + 导航箭头 */}
      <div className="flex items-end justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ukraine-blue-800 sm:text-2xl">
            {t('title')}
          </h3>
          <div className="mt-2 accent-line" />
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!scrollState.left}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ukraine-blue-200 text-ukraine-blue-500 transition-all duration-200 hover:bg-ukraine-blue-50 disabled:opacity-30 disabled:hover:bg-transparent sm:h-10 sm:w-10"
            aria-label="Scroll left"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 4l-4 4 4 4" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!scrollState.right}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ukraine-blue-200 text-ukraine-blue-500 transition-all duration-200 hover:bg-ukraine-blue-50 disabled:opacity-30 disabled:hover:bg-transparent sm:h-10 sm:w-10"
            aria-label="Scroll right"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      </div>

      {/* 横向滚动容器 */}
      <div
        ref={scrollRef}
        className="hide-scrollbar -mx-4 mt-6 flex gap-4 overflow-x-auto px-4 sm:-mx-6 sm:mt-8 sm:gap-6 sm:px-6 lg:-mx-8 lg:gap-8 lg:px-8 snap-x snap-mandatory"
      >
        {items.map((item, i) => {
          const placeholder = PLACEHOLDERS[i];
          const hasImage = item.image !== '';

          return (
            <div
              key={i}
              className="group w-[85vw] max-w-[780px] shrink-0 snap-start overflow-hidden rounded-xl border border-ukraine-blue-100/60 bg-white transition-all duration-300 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/30 sm:w-[70vw] sm:rounded-2xl"
            >
              {/* 左右两栏 — 移动端堆叠，sm 以上并排 */}
              <div className="flex flex-col sm:flex-row sm:items-stretch">
                {/* 左侧：图片 */}
                {hasImage ? (
                  <div className="relative h-44 overflow-hidden sm:h-auto sm:w-2/5 sm:min-h-[320px]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 85vw, 30vw"
                    />
                    {/* 右侧渐变遮罩（桌面端融合过渡） */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-white/60 to-transparent sm:block" />
                    {/* 底部渐变遮罩（移动端） */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/60 to-transparent sm:hidden" />
                  </div>
                ) : (
                  <div className={`relative flex h-44 items-center justify-center bg-gradient-to-br sm:h-auto sm:w-2/5 sm:min-h-[320px] ${placeholder.gradient}`}>
                    <div className="opacity-25">
                      {placeholder.icon}
                    </div>
                  </div>
                )}

                {/* 右侧：文字内容 */}
                <div className="flex flex-1 flex-col justify-center px-4 py-4 sm:px-8 sm:py-8">
                  <h4 className="font-[family-name:var(--font-display)] text-lg font-bold text-ukraine-blue-800 sm:text-2xl">
                    {item.title}
                  </h4>

                  {item.text.split('\n\n').map((paragraph, pi) => (
                    <p key={pi} className="mt-2 text-sm leading-relaxed text-gray-600 sm:mt-3 sm:text-base">
                      {paragraph}
                    </p>
                  ))}

                  {item.listCount > 0 && (
                    <ul className="mt-3 grid grid-cols-1 gap-1 sm:mt-4 sm:grid-cols-2 sm:gap-1.5">
                      {Array.from({ length: item.listCount }, (_, li_i) => (
                        <li key={li_i} className="flex items-start gap-2 text-xs text-gray-600 sm:text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ukraine-blue-300" />
                          {t(`items.${i}.list.${li_i}`)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
