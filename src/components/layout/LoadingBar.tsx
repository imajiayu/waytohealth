'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';

export default function LoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setFinishing(false);
    setProgress(0);
  }, []);

  const stopLoading = useCallback(() => {
    // 快速填满，动画结束后恢复静态渐变
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

  // pathname 变化 = 导航完成
  useEffect(() => {
    if (loading) {
      stopLoading();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 加载中缓慢前进
  useEffect(() => {
    if (loading && !finishing) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // 越接近 90 越慢
          const increment = (90 - prev) * 0.08;
          return prev + Math.max(increment, 0.5);
        });
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
                : 'width 100ms linear',
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
