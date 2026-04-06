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
 *
 * 当元素不在视口中时停止 rAF 循环，避免 CPU 空转。
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
  // iOS Safari 会把 scrollLeft 取整到整数像素，直接 `+= 0.5` 这种亚像素增量会被丢掉，
  // 表现为完全不滚动。这里用一个浮点内部状态累积位置，再写入 scrollLeft，
  // 这样无论 Safari 如何取整，内部状态都不会丢失精度。
  const scrollPos = useRef(0);
  // rAF 自递归用 ref 跳板，避免 useCallback 内部引用自身触发 hooks lint 报错
  const tickRef = useRef<(timestamp: number) => void>(() => {});

  const tick = useCallback(
    (timestamp: number) => {
      const el = scrollRef.current;
      if (!el) return;

      if (isUserScrolling.current) {
        lastTimestamp.current = null;
        // 用户手动滚动期间同步内部状态，恢复自动滚动时才能从用户位置继续
        scrollPos.current = el.scrollLeft;
        animRef.current = requestAnimationFrame((ts) => tickRef.current(ts));
        return;
      }

      if (lastTimestamp.current !== null) {
        const delta = (timestamp - lastTimestamp.current) / 1000;
        scrollPos.current += speed * delta;

        // 滚动到复制区域一半时无缝跳回起点
        const halfScroll = el.scrollWidth / 2;
        if (halfScroll > 0 && scrollPos.current >= halfScroll) {
          scrollPos.current -= halfScroll;
        }

        el.scrollLeft = scrollPos.current;
      }

      lastTimestamp.current = timestamp;
      animRef.current = requestAnimationFrame((ts) => tickRef.current(ts));
    },
    [speed],
  );

  // 保持 tickRef 指向最新 tick 闭包
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // 启动 rAF 循环
  const startAnimation = useCallback(() => {
    if (animRef.current) return; // 已在运行
    lastTimestamp.current = null;
    animRef.current = requestAnimationFrame((ts) => tickRef.current(ts));
  }, []);

  // 停止 rAF 循环
  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    lastTimestamp.current = null;
  }, []);

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

    // 可见性检测：仅在元素可见时运行 rAF 循环
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
        } else {
          stopAnimation();
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);

    el.addEventListener('wheel', handleUserScroll, { passive: true });
    el.addEventListener('touchstart', handleUserScroll, { passive: true });
    el.addEventListener('pointerdown', handleUserScroll);

    return () => {
      stopAnimation();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      observer.disconnect();
      el.removeEventListener('wheel', handleUserScroll);
      el.removeEventListener('touchstart', handleUserScroll);
      el.removeEventListener('pointerdown', handleUserScroll);
    };
  }, [handleUserScroll, startAnimation, stopAnimation]);

  return scrollRef;
}
