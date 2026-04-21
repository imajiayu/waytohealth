'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import FocusTrap from 'focus-trap-react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface NewsLightboxProps {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// Blob URL 或旧相对文件名都能解析
function resolveSrc(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `/data/news/images/${src}`;
}

export default function NewsLightbox({ images, startIndex, alt, onClose }: NewsLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const thumbRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(true);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + images.length) % images.length);
    },
    [images.length]
  );

  // ESC 关闭由 useEscapeKey 统一处理
  useEscapeKey(true, onClose);

  // ← → 翻页
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [go]);

  // 当前缩略图滚入视图
  useEffect(() => {
    const thumb = thumbRef.current?.querySelector<HTMLElement>(`[data-thumb="${index}"]`);
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [index]);

  // 阻止事件冒泡到背景（背景 onClick 关闭），让内部元素可自行处理点击
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <FocusTrap
      focusTrapOptions={{
        escapeDeactivates: false,
        clickOutsideDeactivates: false,
        allowOutsideClick: true,
      }}
    >
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ukraine-navy/96 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
    >
      {/* 计数器（左上角） */}
      <div className="pointer-events-none absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-[family-name:var(--font-data)] text-[11px] uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm">
        <span className="text-ukraine-gold-300">{pad2(index + 1)}</span>
        <span className="text-white/30">/</span>
        <span>{pad2(images.length)}</span>
      </div>

      {/* 关闭（右上角） */}
      <button
        type="button"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10 hover:text-white"
      >
        <X className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* 左箭头 */}
      {images.length > 1 && (
        <button
          type="button"
          aria-label="Previous"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className="group absolute left-2 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10 hover:text-white sm:left-6"
        >
          <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.5} />
        </button>
      )}

      {/* 右箭头 */}
      {images.length > 1 && (
        <button
          type="button"
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className="group absolute right-2 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10 hover:text-white sm:right-6"
        >
          <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
        </button>
      )}

      {/* 主图容器 — 限定在计数器/缩略图之间的区域，空白区域能穿透到背景关闭 */}
      <div
        className="pointer-events-none absolute inset-x-4 top-20 bottom-28 flex items-center justify-center sm:inset-x-20"
      >
        <div
          className="pointer-events-auto relative h-full w-full max-w-5xl"
          onClick={stop}
        >
          <Image
            key={images[index]}
            src={resolveSrc(images[index])}
            alt={`${alt} — ${index + 1}/${images.length}`}
            fill
            sizes="(max-width: 640px) 92vw, 80vw"
            className="object-contain"
            loading="eager"
          />
        </div>
      </div>

      {/* 缩略图条 */}
      {images.length > 1 && (
        <div
          ref={thumbRef}
          className="hide-scrollbar absolute bottom-5 left-1/2 z-20 flex max-w-[92vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-full border border-white/10 bg-black/30 p-2 backdrop-blur-md"
          onClick={stop}
        >
          {images.map((name, i) => (
            <button
              key={name}
              type="button"
              data-thumb={i}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-md transition ${
                i === index
                  ? 'opacity-100 ring-2 ring-ukraine-gold-500'
                  : 'opacity-55 hover:opacity-90'
              }`}
            >
              <Image
                src={resolveSrc(name)}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
    </FocusTrap>
  );
}
