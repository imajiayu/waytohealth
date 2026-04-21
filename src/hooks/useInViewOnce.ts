'use client';

import { useRef, useState, useEffect } from 'react';

// 共享 IntersectionObserver — 所有使用 useInViewOnce 的元素共用同一个 observer。
// 用 globalThis key 保存，避免 Vite/Next.js HMR 热替换模块时重复创建 observer。
type Shared = {
  observer: IntersectionObserver | null;
  callbacks: Map<Element, () => void>;
};
const SHARED_KEY = '__wthSharedInViewObserver__';
function getShared(): Shared {
  const g = globalThis as unknown as { [SHARED_KEY]?: Shared };
  if (!g[SHARED_KEY]) {
    g[SHARED_KEY] = { observer: null, callbacks: new Map() };
  }
  return g[SHARED_KEY]!;
}

function getObserver() {
  const shared = getShared();
  if (shared.observer) return shared.observer;
  shared.observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = shared.callbacks.get(entry.target);
          if (cb) {
            cb();
            shared.callbacks.delete(entry.target);
            shared.observer!.unobserve(entry.target);
          }
        }
      }
    },
    { threshold: 0.15 },
  );
  return shared.observer;
}

/**
 * 检测元素是否进入视口（一次性），所有实例共享同一个 IntersectionObserver
 */
export function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = getObserver();
    const shared = getShared();
    shared.callbacks.set(el, () => setIsVisible(true));
    observer.observe(el);

    return () => {
      shared.callbacks.delete(el);
      observer.unobserve(el);
    };
  }, []);

  return { ref, isVisible };
}
