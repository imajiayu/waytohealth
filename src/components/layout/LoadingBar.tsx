'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';

export default function LoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startLoading = useCallback(() => {
    setLoading(true);
    setFinishing(false);
    setProgress(0);
    startTimeRef.current = performance.now();
  }, []);

  const stopLoading = useCallback(() => {
    setProgress(100);
    setFinishing(true);
    setTimeout(() => {
      setLoading(false);
      setFinishing(false);
      setProgress(0);
    }, 200);
  }, []);

  // 监听自定义事件：导航开始
  useEffect(() => {
    const handler = () => startLoading();
    window.addEventListener('routeChangeStart', handler);
    return () => window.removeEventListener('routeChangeStart', handler);
  }, [startLoading]);

  // pathname 变化 = 导航完成 → 停止进度条并滚动到顶部
  useEffect(() => {
    if (loading) {
      stopLoading();
    }
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 使用 rAF 驱动进度（替代 setInterval，避免高频 state 更新）
  useEffect(() => {
    if (!loading || finishing) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let lastUpdate = 0;
    function tick(now: number) {
      // 每 200ms 更新一次 state（比原来 100ms 更低频）
      if (now - lastUpdate > 200) {
        const elapsed = (now - startTimeRef.current) / 1000;
        // 渐近 90%：1 - e^(-t/4) 曲线
        const target = 90 * (1 - Math.exp(-elapsed / 4));
        setProgress(target);
        lastUpdate = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loading, finishing]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[2px]">
      {/* 静态渐变背景 - 始终可见 */}
      <div className="absolute inset-0 gradient-brand-line" />

      {/* 加载进度条 - 覆盖在上面 */}
      {loading && (
        <>
          {/* 白色遮罩覆盖底层 */}
          <div className="absolute inset-0 bg-white" />
          {/* 渐变进度 */}
          <div
            className="absolute top-0 left-0 h-full gradient-brand-line"
            style={{
              width: `${progress}%`,
              transition: finishing
                ? 'width 200ms ease-out'
                : 'width 200ms linear',
            }}
          />
        </>
      )}
    </div>
  );
}

/** 在任意位置调用以触发 loading bar */
export function triggerRouteChange() {
  window.dispatchEvent(new Event('routeChangeStart'));
}
