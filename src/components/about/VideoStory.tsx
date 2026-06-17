'use client';

import { useState, useRef } from 'react';

type Props = {
  /** 视频源（按 locale 切换） */
  src: string;
  /** 大写元数据：上方标签 */
  eyebrow: string;
  /** 视频标题（用于无障碍 aria-label） */
  title: string;
  /** 左下角作者信息 */
  meta: string;
  /** 时长展示 */
  runtime: string;
};

/**
 * 杂志/纪录片风格的视频播放器
 * - 默认强制渲染视频首帧作为封面（preload=metadata + #t 媒体片段，只拉首帧字节）
 * - 封面上仅保留左下角作者信息，整块画面可点击播放
 * - 播放后切换原生 controls
 *
 * 注意：locale 切换时，父组件应通过 key={locale} 强制重新挂载，
 *      避免在内部 effect 中重置 state（违反 react-hooks/set-state-in-effect）
 */
export default function VideoStory({ src, eyebrow, title, meta, runtime }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handlePlay() {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(true);
    // 用户手势触发，可带声音自动播放；失败则由原生 controls 兜底
    video.play().catch(() => {});
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

        {/* 视频：始终挂载，#t=0.1 媒体片段 + preload=metadata 强制渲染首帧作封面 */}
        <video
          ref={videoRef}
          src={`${src}#t=0.1`}
          controls={isPlaying}
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full bg-ukraine-navy"
        >
          {/* TODO: 字幕文件就绪后补全 <track src="..." srclang="ua" label="Українська" /> */}
        </video>

        {/* 未播放：整块可点的播放层，保留中央播放按钮 + 标题 + 左下角作者信息 */}
        {!isPlaying && (
          <button
            type="button"
            onClick={handlePlay}
            className="group absolute inset-0 z-10 flex flex-col items-center justify-center text-white"
            aria-label={`Play ${title}`}
          >
            {/* 底部渐变 ── 保证左下角文字在任意首帧上可读 */}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ukraine-navy/80 to-transparent" />

            {/* 中央：大圆形播放按钮 */}
            <span className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
              {/* 旋转描边圆环 */}
              <span className="absolute inset-0 rounded-full border border-dashed border-ukraine-gold-500/50 transition-all duration-700 ease-out group-hover:rotate-180 group-hover:border-ukraine-gold-500" />
              {/* 内圆 */}
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ukraine-gold-500 text-ukraine-blue-900 shadow-[0_10px_30px_rgba(245,184,0,0.45)] transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 sm:h-7 sm:w-7" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>

            {/* 标题 */}
            <span className="relative mt-6 max-w-md px-6 text-center font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,30,55,0.65)] sm:mt-8 sm:text-3xl">
              {title}
            </span>

            {/* 左下角作者信息 */}
            <span className="absolute bottom-5 left-5 text-left font-[family-name:var(--font-data)] text-sm font-semibold uppercase tracking-[0.18em] text-white drop-shadow-[0_2px_10px_rgba(0,30,55,0.7)] sm:bottom-7 sm:left-7 sm:text-base">
              {meta}
            </span>
          </button>
        )}
      </div>
    </figure>
  );
}
