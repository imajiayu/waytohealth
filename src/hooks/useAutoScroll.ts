import { useRef, useEffect } from 'react';

interface UseAutoScrollOptions {
  /** 每秒滚动像素数 */
  speed?: number;
  /** 用户手动滚动后恢复自动滚动的延迟（毫秒） */
  resumeDelay?: number;
}

/**
 * 自动横向滚动 hook — 用于合作伙伴 logo 无缝循环滚动
 *
 * 要求容器内的子元素被复制一份（[...items, ...items]），
 * 滚动到一半时自动跳回起点，实现无缝循环。
 *
 * 当元素不在视口中时停止 rAF 循环，避免 CPU 空转。
 */
export function useAutoScroll<T extends HTMLElement>({
  speed = 30,
  resumeDelay = 3000,
}: UseAutoScrollOptions = {}) {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let rafId: number | null = null;
    let lastTs: number | null = null;
    let isUserScrolling = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    // iOS Safari 会把 scrollLeft 取整到整数像素，直接 `+= 0.5` 这种亚像素增量会被丢掉，
    // 表现为完全不滚动。这里用一个浮点内部状态累积位置，再写入 scrollLeft，
    // 这样无论 Safari 如何取整，内部状态都不会丢失精度。
    let scrollPos = 0;

    const loop = (ts: number) => {
      if (isUserScrolling) {
        // 用户手动滚动期间同步内部状态，恢复自动滚动时才能从用户位置继续
        scrollPos = el.scrollLeft;
        lastTs = null;
      } else if (lastTs !== null) {
        scrollPos += (speed * (ts - lastTs)) / 1000;

        // 滚动到复制区域一半时无缝跳回起点
        const half = el.scrollWidth / 2;
        if (half > 0 && scrollPos >= half) scrollPos -= half;

        el.scrollLeft = scrollPos;
      }
      lastTs = ts;
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (rafId !== null) return;
      lastTs = null;
      rafId = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTs = null;
    };

    const handleUserScroll = () => {
      isUserScrolling = true;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        isUserScrolling = false;
      }, resumeDelay);
    };

    // 可见性检测：仅在元素可见时运行 rAF 循环
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(el);

    el.addEventListener('wheel', handleUserScroll, { passive: true });
    el.addEventListener('touchstart', handleUserScroll, { passive: true });
    el.addEventListener('pointerdown', handleUserScroll);

    return () => {
      stop();
      if (resumeTimer) clearTimeout(resumeTimer);
      observer.disconnect();
      el.removeEventListener('wheel', handleUserScroll);
      el.removeEventListener('touchstart', handleUserScroll);
      el.removeEventListener('pointerdown', handleUserScroll);
    };
  }, [speed, resumeDelay]);

  return scrollRef;
}
