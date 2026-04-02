import { useRef, useEffect, useCallback } from 'react';

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
 */
export function useAutoScroll<T extends HTMLElement>({
  speed = 30,
  resumeDelay = 3000,
}: UseAutoScrollOptions = {}) {
  const scrollRef = useRef<T>(null);
  const animRef = useRef<number | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrolling = useRef(false);
  const lastTimestamp = useRef<number | null>(null);

  const tick = useCallback(
    (timestamp: number) => {
      const el = scrollRef.current;
      if (!el || isUserScrolling.current) {
        lastTimestamp.current = null;
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTimestamp.current !== null) {
        const delta = (timestamp - lastTimestamp.current) / 1000;
        el.scrollLeft += speed * delta;

        // 滚动到复制区域一半时无缝跳回起点
        const halfScroll = el.scrollWidth / 2;
        if (el.scrollLeft >= halfScroll) {
          el.scrollLeft -= halfScroll;
        }
      }

      lastTimestamp.current = timestamp;
      animRef.current = requestAnimationFrame(tick);
    },
    [speed],
  );

  const handleUserScroll = useCallback(() => {
    isUserScrolling.current = true;
    lastTimestamp.current = null;

    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, resumeDelay);
  }, [resumeDelay]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleUserScroll, { passive: true });
    el.addEventListener('touchstart', handleUserScroll, { passive: true });
    el.addEventListener('pointerdown', handleUserScroll);

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      el.removeEventListener('wheel', handleUserScroll);
      el.removeEventListener('touchstart', handleUserScroll);
      el.removeEventListener('pointerdown', handleUserScroll);
    };
  }, [tick, handleUserScroll]);

  return scrollRef;
}
