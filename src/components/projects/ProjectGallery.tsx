'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const Lightbox = dynamic(() => import('@/components/common/Lightbox'));

interface Props {
  /** 裸文件名列表（不含路径） */
  images: string[];
  /** 图片所在目录的绝对路径前缀，如 `/data/projects/4` */
  basePath: string;
  /** 用作 alt 文本和 lightbox 标题 */
  alt: string;
}

export default function ProjectGallery({ images, basePath, alt }: Props) {
  const t = useTranslations('projectDetail');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const splitAt = Math.ceil(images.length / 2);
  // ≤3 张：竖向构图；4+ 张：横向构图
  const aspectClass = images.length <= 3 ? 'aspect-[3/4]' : 'aspect-[4/3]';
  const fullUrls = images.map((img) => `${basePath}/${img}`);

  const renderCell = (img: string, i: number, sizes: string, extraClass = '') => (
    <button
      key={i}
      type="button"
      onClick={() => setLightboxIndex(i)}
      aria-label={t('viewImage', { n: i + 1 })}
      className={`group relative cursor-zoom-in overflow-hidden rounded-xl outline-none transition-transform duration-300 hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-ukraine-gold-500 ${aspectClass} ${extraClass}`}
    >
      <Image
        src={`${basePath}/${img}`}
        alt={`${alt} ${i + 1}`}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes={sizes}
      />
    </button>
  );

  return (
    <>
      <section className="mt-10 sm:mt-12">
        {images.length <= 3 ? (
          /* ≤3 张图：mobile 2 列网格（1 张单列、3 张末图跨 2 列）；sm+ 等宽并排 */
          <div
            className={`${
              images.length === 1 ? 'grid grid-cols-1' : 'grid grid-cols-2'
            } gap-2.5 sm:flex sm:items-stretch sm:gap-3`}
          >
            {images.map((img, i) =>
              renderCell(
                img,
                i,
                '(max-width: 640px) 50vw, (max-width: 1024px) 28vw, 220px',
                `sm:flex-1${images.length === 3 && i === 2 ? ' col-span-2 sm:col-span-1' : ''}`,
              ),
            )}
          </div>
        ) : (
          /* 双行：4+ 张图，等比横图 */
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <div className="flex items-stretch gap-2.5 sm:gap-3">
              {images.slice(0, splitAt).map((img, i) =>
                renderCell(
                  img,
                  i,
                  '(max-width: 640px) 33vw, (max-width: 1024px) 28vw, 220px',
                  'flex-1',
                ),
              )}
            </div>
            <div className="flex items-stretch gap-2.5 sm:gap-3">
              {images.slice(splitAt).map((img, i) =>
                renderCell(
                  img,
                  splitAt + i,
                  '(max-width: 640px) 33vw, (max-width: 1024px) 28vw, 220px',
                  'flex-1',
                ),
              )}
            </div>
          </div>
        )}
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          images={fullUrls}
          startIndex={lightboxIndex}
          alt={alt}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
