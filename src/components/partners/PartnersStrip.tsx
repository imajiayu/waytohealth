'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { partners } from '@/data/partners';

/* ── 自动+手动滚动的 Partners 条（嵌入渐变色块内） ──────────── */

export default function PartnersStrip() {
  const t = useTranslations('partners');
  const scrollRef = useAutoScroll<HTMLDivElement>();

  // 复制两份实现无缝循环
  const items = [...partners, ...partners];

  return (
    <div className="px-6 py-8 sm:px-8 sm:py-10 md:py-12">
      {/* 标题行 */}
      <div className="mb-6 sm:mb-8 flex items-center gap-4 sm:gap-5">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-[family-name:var(--font-display)]
                       font-semibold text-white/90 tracking-tight">
          {t('title')}
        </h3>
        <Link
          href="/partners"
          className="inline-flex items-center gap-2 rounded-full
                     bg-white/15 backdrop-blur-sm px-6 py-2.5 sm:px-7 sm:py-3
                     text-base sm:text-lg font-semibold text-white/80
                     hover:bg-white/25 hover:text-white
                     transition-all duration-200 group"
        >
          {t('becomePartner')}
          <ArrowRight className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform
                                 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 滚动条 */}
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto hide-scrollbar"
      >
        {items.map((partner, i) => (
          <a
            key={`${partner.id}-${i}`}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-shrink-0 flex items-center justify-center
                       px-6 sm:px-8 md:px-10 py-4"
          >
            <div className={cn(
              'flex items-center justify-center rounded-lg px-3 py-1.5',
              partner.darkBg && 'bg-white/10'
            )}>
              <Image
                src={partner.logo}
                alt={t(`list.${partner.id}.name`)}
                width={120}
                height={48}
                className="max-h-12 sm:max-h-14 md:max-h-16 w-auto object-contain"
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
