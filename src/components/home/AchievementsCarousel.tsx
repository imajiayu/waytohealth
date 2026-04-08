'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ChapterMark from '@/components/shared/ChapterMark';

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
  const tChapters = useTranslations('homeChapters');
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
    // 先用 t.has 检查 list 字段是否存在，避免触发 MISSING_MESSAGE 警告
    let list: string[] = [];
    if (t.has(`items.${i}.list`)) {
      const raw = t.raw(`items.${i}.list`);
      if (Array.isArray(raw)) list = raw as string[];
    }
    return {
      title: t(`items.${i}.title`),
      text: t(`items.${i}.text`),
      image: hasImage ? t(`items.${i}.image`) : '',
      list,
    };
  });

  return (
    <div id="achievements" className="mt-14 scroll-mt-16 sm:mt-20">
      <div className="grid grid-cols-12 gap-6 sm:gap-8">
        {/* 左侧 ── ChapterMark */}
        <div className="col-span-12 lg:col-span-3">
          <ChapterMark number="04" label={tChapters('items.achievements')} />
        </div>

        {/* 右侧 ── 标题 + 导航箭头 */}
        <div className="col-span-12 lg:col-span-9 lg:pl-4">
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
        </div>
      </div>

      {/* 横向滚动容器 — 默认 align-items: stretch 让所有卡片自动对齐到最高那张的高度 */}
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
              className="group flex w-[85vw] max-w-[820px] shrink-0 snap-start overflow-hidden rounded-xl border border-ukraine-blue-100/60 bg-white transition-all duration-300 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/30 sm:w-[72vw] sm:rounded-2xl"
            >
              {/* 左右两栏 — 移动端堆叠，sm 以上并排；外层 carousel stretch + 内层 h-full 链路让所有卡片同高 */}
              <div className="flex h-full w-full flex-col sm:flex-row">
                {/* 左侧：图片（sm:h-full 显式吃满内层高度，object-cover 填满分配区域无空隙） */}
                {hasImage ? (
                  <div className="relative h-64 w-full shrink-0 overflow-hidden bg-ukraine-blue-50/40 sm:h-full sm:w-2/5">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 85vw, 30vw"
                    />
                  </div>
                ) : (
                  <div className={`relative flex h-56 w-full shrink-0 items-center justify-center bg-gradient-to-br sm:h-full sm:w-2/5 ${placeholder.gradient}`}>
                    <div className="opacity-25">
                      {placeholder.icon}
                    </div>
                  </div>
                )}

                {/* 右侧：文字内容 — 自然流式排版，无内部滚动，所有信息一次性展示 */}
                <div className="flex flex-1 flex-col px-5 py-5 sm:px-8 sm:py-7">
                  <h4 className="font-[family-name:var(--font-display)] text-lg font-bold text-ukraine-blue-800 sm:text-[1.4rem] sm:leading-snug">
                    {item.title}
                  </h4>

                  {item.text.split('\n\n').map((paragraph, pi) => (
                    <p key={pi} className="mt-2 text-[0.875rem] leading-relaxed text-gray-600 sm:mt-2.5 sm:text-[0.95rem] sm:leading-[1.65]">
                      {paragraph}
                    </p>
                  ))}

                  {item.list.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1 sm:mt-3.5 sm:gap-1.5">
                      {item.list.map((listItem, li_i) => (
                        <li key={li_i} className="flex items-start gap-2 text-[0.875rem] leading-relaxed text-gray-600 sm:text-[0.95rem] sm:leading-[1.65]">
                          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ukraine-blue-300 sm:mt-[11px]" />
                          {listItem}
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
