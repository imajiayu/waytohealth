'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import partners from '@/data/partners.json';

/* ── Types ─────────────────────────────────────────────────── */

interface PartnersShowcaseProps {
  mode?: 'scroll' | 'grid';
  showTitle?: boolean;
  className?: string;
}

/* ── Partner Card ──────────────────────────────────────────── */

function PartnerCard({ id, logo, url, name, darkBg }: {
  id: string;
  logo: string;
  url: string;
  name: string;
  darkBg?: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center justify-center gap-3
                 bg-white border border-gray-100 rounded-2xl p-6
                 hover:shadow-lg hover:shadow-ukraine-blue-500/8
                 hover:border-ukraine-blue-200 hover:-translate-y-1
                 transition-all duration-300 cursor-pointer relative"
    >
      {/* 外链图标 */}
      <ArrowUpRight
        className="absolute top-3 right-3 w-4 h-4 text-gray-300
                   opacity-0 group-hover:opacity-100 group-hover:text-ukraine-blue-400
                   transition-all duration-200"
      />

      {/* Logo */}
      <div className={cn(
        'w-full h-16 flex items-center justify-center rounded-lg px-3',
        darkBg && 'bg-slate-800'
      )}>
        <Image
          src={logo}
          alt={name}
          width={160}
          height={64}
          className="max-h-14 w-auto object-contain
                     group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* 名称 */}
      <span className="text-sm text-gray-500 group-hover:text-ukraine-blue-600
                        transition-colors duration-200 text-center leading-tight">
        {name}
      </span>
    </a>
  );
}

/* ── Main Component ────────────────────────────────────────── */

export default function PartnersShowcase({
  mode = 'scroll',
  showTitle = true,
  className,
}: PartnersShowcaseProps) {
  const t = useTranslations('partners');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 检测滚动状态，更新箭头可见性
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    if (mode !== 'scroll') return;
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [mode, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 220;
    el.scrollBy({
      left: direction === 'left' ? -cardWidth * 2 : cardWidth * 2,
      behavior: 'smooth',
    });
  };

  return (
    <section className={cn('py-16', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区 */}
        {showTitle && (
          <div className="mb-10 flex flex-wrap items-center gap-4 sm:gap-5">
            <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-display)]
                           font-bold text-ukraine-blue-500">
              {t('title')}
            </h2>
            {mode === 'scroll' && (
              <Link
                href="/partners"
                className="inline-flex items-center gap-2 px-5 py-2.5
                           bg-ukraine-blue-500/10 text-ukraine-blue-600
                           rounded-full font-semibold text-base
                           hover:bg-ukraine-blue-500 hover:text-white
                           active:scale-[0.97]
                           transition-all duration-200 group"
              >
                {t('allPartners')}
                <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        )}

        {/* 滚动模式 */}
        {mode === 'scroll' && (
          <div className="relative group/scroll">
            {/* 左箭头 */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                           w-10 h-10 rounded-full bg-white/90 border border-gray-200
                           shadow-md flex items-center justify-center
                           text-gray-400 hover:text-ukraine-blue-500 hover:border-ukraine-blue-200
                           opacity-0 group-hover/scroll:opacity-100
                           transition-all duration-200 cursor-pointer
                           -translate-x-1/2"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* 右箭头 */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                           w-10 h-10 rounded-full bg-white/90 border border-gray-200
                           shadow-md flex items-center justify-center
                           text-gray-400 hover:text-ukraine-blue-500 hover:border-ukraine-blue-200
                           opacity-0 group-hover/scroll:opacity-100
                           transition-all duration-200 cursor-pointer
                           translate-x-1/2"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* 左右渐隐遮罩 */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-12 z-[5]
                              bg-gradient-to-r from-white to-transparent pointer-events-none" />
            )}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-12 z-[5]
                              bg-gradient-to-l from-white to-transparent pointer-events-none" />
            )}

            {/* 滚动容器 */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto py-2 -my-2
                         scroll-snap-x-mandatory
                         [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex-shrink-0 w-[180px] sm:w-[200px] lg:w-[220px]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <PartnerCard
                    id={partner.id}
                    logo={partner.logo}
                    url={partner.url}
                    darkBg={'darkBg' in partner ? (partner as { darkBg: boolean }).darkBg : false}
                    name={t(`list.${partner.id}.name`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 网格模式 */}
        {mode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {partners.map((partner) => (
              <PartnerCard
                key={partner.id}
                id={partner.id}
                logo={partner.logo}
                url={partner.url}
                darkBg={'darkBg' in partner ? (partner as { darkBg: boolean }).darkBg : false}
                name={t(`list.${partner.id}.name`)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
