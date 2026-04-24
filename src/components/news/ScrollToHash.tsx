'use client';

import { useEffect } from 'react';

// Next.js App Router + next-intl Link 在 SPA 导航后，hash 滚动偶尔会被 SSR hydration
// / 图片懒加载打断。显式在 mount 时按 location.hash scroll 一次，保证首页卡片跳转后
// 能精确停在对应条目。
export default function ScrollToHash() {
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash || hash.length < 2) return false;
      let el: Element | null = null;
      try {
        el = document.querySelector(hash);
      } catch {
        return false;
      }
      if (!el) return false;
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
      return true;
    };

    // 初次 mount 可能 DOM 还在 hydrate，延一帧再尝试；图片用 aspect-ratio 占位，
    // 一般不会二次布局偏移。最多再追加一次 100ms 兜底。
    const raf1 = requestAnimationFrame(() => {
      const ok = scrollToHash();
      if (!ok) {
        setTimeout(scrollToHash, 100);
      }
    });

    const onHashChange = () => scrollToHash();
    window.addEventListener('hashchange', onHashChange);
    return () => {
      cancelAnimationFrame(raf1);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  return null;
}
