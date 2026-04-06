import { useRef, useEffect } from 'react';

interface UseAutoScrollOptions {
  /** 每秒滚动像素数 */
  speed?: number;
  /** 用户手动滚动后恢复自动滚动的延迟（毫秒） */
  resumeDelay?: number;
}

/**
 * 自动横向无限循环滚动 hook — 从左向右匀速滚动，到末尾无缝衔接
 *
 * 循环原理：当第一个子元素完全滚出左边界时，将其 appendChild 到容器末尾，
 * 同时把 scrollLeft 减去它的 stride（offsetWidth + flex gap），视觉上零跳变。
 * JSX 中只需渲染一份数据，不需要复制内容。
 *
 * - 不在视口时暂停 rAF，避免 CPU 空转
 * - 用户手动滚动时暂停，resumeDelay 后恢复（从用户当前位置继续循环）
 * - 亚像素增量在内部累积，兼容 iOS Safari 对 scrollLeft 的整数取整
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
    // iOS Safari 会把 scrollLeft 取整为整数，亚像素增量会被丢弃。
    // 用浮点累积亚像素，每帧只写入整数部分到 scrollLeft。
    let fractional = 0;

    const stop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTs = null;
    };

    const loop = (ts: number) => {
      if (isUserScrolling) {
        // 用户手动滚动期间不累积，恢复时从用户当前位置继续
        fractional = 0;
        lastTs = null;
      } else if (lastTs !== null) {
        fractional += (speed * (ts - lastTs)) / 1000;
        const delta = Math.floor(fractional);
        if (delta > 0) {
          fractional -= delta;
          let newLeft = el.scrollLeft + delta;

          // 无缝循环：若第一个子元素已完全滚出左侧，将其搬到末尾，
          // 并从 scrollLeft 扣除它占用的 stride（第二个子元素的 offsetLeft，
          // 天然包含 flex gap），视觉上完全连续。
          const first = el.firstElementChild as HTMLElement | null;
          const second = first?.nextElementSibling as HTMLElement | null;
          if (first && second) {
            const stride = second.offsetLeft;
            if (stride > 0 && newLeft >= stride) {
              newLeft -= stride;
              el.appendChild(first);
            }
          }

          el.scrollLeft = newLeft;
        }
      }
      lastTs = ts;
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (rafId !== null) return;
      lastTs = null;
      rafId = requestAnimationFrame(loop);
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
