'use client';

import { useState, useRef, useEffect } from 'react';

type Props = {
  /** 视频源（按 locale 切换） */
  src: string;
  /** 海报图（可选） */
  poster?: string;
  /** 大写元数据：上方标签 */
  eyebrow: string;
  /** 视频标题 */
  title: string;
  /** 副信息：作者、时长 */
  meta: string;
  /** 时长展示 */
  runtime: string;
  /** 左上角录制标记 */
  rec: string;
  /** 右上角类型标签 */
  genre: string;
  /** 右上角画质标签 */
  quality: string;
  /** 底部播放提示 */
  pressPlay: string;
};

/**
 * 杂志/纪录片风格的视频播放器
 * - 默认显示电影感封面 + 大播放按钮
 * - 用户点击后才挂载 <video> 并加载，避免大文件预加载
 * - 播放后使用原生 controls
 *
 * 注意：locale 切换时，父组件应通过 key={locale} 强制重新挂载，
 *      避免在内部 effect 中重置 state（违反 react-hooks/set-state-in-effect）
 */
export default function VideoStory({ src, poster, eyebrow, title, meta, runtime, rec, genre, quality, pressPlay }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 视频挂载后自动播放
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {
        /* 自动播放失败时由用户手动 */
      });
    }
  }, [isPlaying]);

  function handlePlay() {
    setIsPlaying(true);
  }

  return (
    <figure className="relative">
      {/* 角标元数据 ── 像电影海报一样 */}
      <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
        <div className="flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.3em] text-ukraine-gold-600 sm:text-xs">
            {eyebrow}
          </span>
          <span className="h-px w-10 bg-ukraine-blue-200" />
        </div>
        <span className="font-[family-name:var(--font-data)] text-[10px] font-medium uppercase tracking-[0.22em] text-ukraine-blue-500 sm:text-xs">
          {runtime}
        </span>
      </div>

      {/* 主播放容器 ── 16:9 电影感深色框 */}
      <div className="relative aspect-video overflow-hidden rounded-[6px] bg-ukraine-navy shadow-[0_30px_70px_-20px_rgba(0,55,90,0.45)] ring-1 ring-ukraine-blue-900/10 sm:rounded-[10px]">
        {/* 外侧细描金边 ── 电影海报式 */}
        <div className="pointer-events-none absolute inset-0 z-20 rounded-[6px] ring-1 ring-inset ring-ukraine-gold-500/20 sm:rounded-[10px]" />

        {/* 内部光晕装饰 ── 仅在 poster 状态显示 */}
        {!isPlaying && (
          <>
            <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full opacity-30 blur-3xl glow-teal" />
            <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full opacity-25 blur-3xl glow-blue" />
          </>
        )}

        {!isPlaying ? (
          // 电影海报状态
          <button
            type="button"
            onClick={handlePlay}
            className="group absolute inset-0 flex flex-col items-center justify-center text-white"
            aria-label={`Play ${title}`}
          >
            {/* 上方角标 */}
            <div className="absolute left-5 top-5 flex items-center gap-2 sm:left-7 sm:top-7">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warm-500" />
              <span className="font-[family-name:var(--font-data)] text-[9px] font-bold uppercase tracking-[0.25em] text-white/70 sm:text-[10px]">
                {rec}
              </span>
            </div>

            {/* 右上角元信息 */}
            <div className="absolute right-5 top-5 text-right sm:right-7 sm:top-7">
              <div className="font-[family-name:var(--font-data)] text-[9px] font-medium uppercase tracking-[0.22em] text-white/50 sm:text-[10px]">
                {genre}
              </div>
              <div className="font-[family-name:var(--font-data)] text-[9px] font-medium uppercase tracking-[0.22em] text-white/50 sm:text-[10px]">
                {quality}
              </div>
            </div>

            {/* 中央：大圆形播放按钮 */}
            <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
              {/* 旋转描边圆环 */}
              <span
                className="absolute inset-0 rounded-full border border-dashed border-ukraine-gold-500/50 transition-all duration-700 ease-out group-hover:rotate-180 group-hover:border-ukraine-gold-500"
              />
              {/* 内圆 */}
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ukraine-gold-500 text-ukraine-blue-900 shadow-[0_10px_30px_rgba(245,184,0,0.45)] transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 sm:h-7 sm:w-7" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>

            {/* 标题 */}
            <h4 className="mt-6 max-w-md px-6 text-center font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white sm:mt-8 sm:text-3xl">
              {title}
            </h4>

            {/* 底部：刻度尺 + 元信息 */}
            <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7">
              <div className="mb-3 flex h-3 items-end gap-[2px] opacity-50">
                {Array.from({ length: 60 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-px bg-white"
                    style={{ height: i % 5 === 0 ? '12px' : '6px' }}
                  />
                ))}
              </div>
              <div className="flex items-end justify-between font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.2em] text-white/60 sm:text-xs">
                <span>{meta}</span>
                <span className="hidden sm:inline">{pressPlay}</span>
              </div>
            </div>
          </button>
        ) : (
          // 播放状态
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            controls
            playsInline
            preload="none"
            className="absolute inset-0 h-full w-full bg-black"
          >
            {/* TODO: 字幕文件就绪后补全 <track src="..." srclang="ua" label="Українська" /> */}
          </video>
        )}
      </div>
    </figure>
  );
}
