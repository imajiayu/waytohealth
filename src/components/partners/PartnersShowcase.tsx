'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { partners } from '@/data/partners';

/* ── Types ─────────────────────────────────────────────────── */

interface PartnersShowcaseProps {
  showTitle?: boolean;
  className?: string;
}

/* ── Logo Item ─────────────────────────────────────────────── */

function PartnerLogo({ logo, url, name, darkBg }: {
  logo: string;
  url?: string;
  name: string;
  darkBg?: boolean;
}) {
  const inner = (
    <div className={cn(
      'flex items-center justify-center rounded-lg px-3 py-2',
      darkBg && 'bg-slate-800'
    )}>
      <Image
        src={logo}
        alt={name}
        width={140}
        height={56}
        className="max-h-12 w-auto object-contain
                   grayscale opacity-60 group-hover:opacity-90
                   transition-opacity duration-300"
      />
    </div>
  );
  const wrapperClass =
    'group flex items-center justify-center rounded-xl p-5 hover:bg-ukraine-blue-50/60 transition-colors duration-300';
  // 无 url 的合作伙伴渲染为非可点击元素
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
      {inner}
    </a>
  ) : (
    <div className={wrapperClass}>{inner}</div>
  );
}

/* ── Main Component ────────────────────────────────────────── */

export default function PartnersShowcase({
  showTitle = true,
  className,
}: PartnersShowcaseProps) {
  const t = useTranslations('partners');

  return (
    <section className={cn('py-12 sm:py-16', className)}>
      <div className="container-page">
        {/* 标题区 */}
        {showTitle && (
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)]
                           font-semibold tracking-tight text-gray-900">
              {t('title')}
            </h2>
          </div>
        )}

        {/* 网格模式 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {partners.map((partner) => (
            <PartnerLogo
              key={partner.id}
              logo={partner.logo}
              url={partner.url}
              darkBg={partner.darkBg}
              name={t(`list.${partner.id}.name`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
