'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { ZoomIn } from 'lucide-react';

const Lightbox = dynamic(() => import('@/components/common/Lightbox'));

interface Props {
  src: string;
  alt: string;
  projectId: number;
}

// 单图项目详情页专用 hero — 把项目卡的 cover 当作唯一一张插图
// 用于没有 contentImages / gallery 的项目（1, 3, 4, 6, 9, 10, 11）
export default function ProjectHeroImage({ src, alt, projectId }: Props) {
  const t = useTranslations('projectDetail');
  const [open, setOpen] = useState(false);

  const padded = projectId.toString().padStart(2, '0');

  return (
    <>
      <section className="mt-10 sm:mt-12">
        <figure className="relative">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('viewPhoto')}
            className="group relative block w-full cursor-zoom-in overflow-hidden rounded-3xl bg-ukraine-blue-50 outline-none ring-1 ring-ukraine-blue-100 shadow-[0_28px_64px_-24px_rgba(0,108,178,0.32)] transition-[transform,box-shadow] duration-500 hover:-translate-y-0.5 hover:shadow-[0_36px_80px_-24px_rgba(0,108,178,0.42)] focus-visible:ring-2 focus-visible:ring-ukraine-gold-500"
          >
            <div className="relative aspect-[8/5] w-full">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              {/* 顶部微渐变 — 让顶部徽章可读 */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ukraine-navy/35 to-transparent"
              />
              {/* 底部强渐变 — 让底部徽章可读 */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ukraine-navy/65 via-ukraine-navy/15 to-transparent"
              />

              {/* 左上角项目编号 */}
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.28em] text-white backdrop-blur-md sm:left-5 sm:top-5">
                <span className="h-1 w-1 rounded-full bg-ukraine-gold-300 shadow-[0_0_6px_rgba(248,206,77,0.9)]" />
                <span className="text-ukraine-gold-300">№</span>
                <span>{padded}</span>
              </div>

              {/* 右下角放大提示 */}
              <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md transition group-hover:bg-white/25 sm:bottom-5 sm:right-5">
                <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.8} />
                {t('expand')}
              </div>
            </div>
          </button>
        </figure>
      </section>

      {open && (
        <Lightbox
          images={[src]}
          startIndex={0}
          alt={alt}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
