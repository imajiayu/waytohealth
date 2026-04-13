'use client';

import Image from 'next/image';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useTranslations } from 'next-intl';

interface Props {
  images: string[];
  projectId: number;
}

export default function ProjectGallery({ images, projectId }: Props) {
  const t = useTranslations('projectDetail');
  const { ref, isVisible } = useInViewOnce<HTMLElement>();
  const photoBase = `/data/projects/${projectId}`;

  if (images.length === 0) return null;

  return (
    <section ref={ref} className="mt-14 sm:mt-16">
      {/* 标题区：装饰线 + 居中小标题 */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-ukraine-blue-100/60" />
        <h2 className="shrink-0 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.25em] text-ukraine-blue-400">
          {t('galleryTitle')}
        </h2>
        <div className="h-px flex-1 bg-ukraine-blue-100/60" />
      </div>

      {/* 图片区 */}
      <div
        className="mt-6"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
          transition:
            'opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
          transitionDelay: '0.15s',
        }}
      >
        {images.length === 1 ? (
          /* 单图：大尺寸沉浸式展示 */
          <div className="relative overflow-hidden rounded-2xl border border-ukraine-blue-100/40">
            <div className="relative aspect-[3/2] w-full sm:aspect-[16/9]">
              <Image
                src={`${photoBase}/${images[0]}`}
                alt={t('galleryTitle')}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 700px"
              />
            </div>
          </div>
        ) : (
          /* 多图：响应式网格 */
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-xl border border-ukraine-blue-100/40"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                  transition:
                    'opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1), transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                  transitionDelay: `${0.2 + i * 0.1}s`,
                }}
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={`${photoBase}/${img}`}
                    alt={`${t('galleryTitle')} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 350px"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
