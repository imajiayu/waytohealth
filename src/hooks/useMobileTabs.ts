'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 移动端 tab 切换共享状态机：active 索引 + 切换方向 + go() + 激活项自动居中。
 * MobileTabSwitcher / MobileProjectSwitcher 共用；direction 驱动
 * animate-panel-forward / animate-panel-backward 的定向滑入动画。
 */
export function useMobileTabs(count: number) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const didMountRef = useRef(false);

  const go = useCallback(
    (next: number) => {
      if (next === active || next < 0 || next >= count) return;
      setDirection(next > active ? 'forward' : 'backward');
      setActive(next);
    },
    [active, count],
  );

  // 激活项自动居中到视口；首渲染跳过，避免页面加载时被动滚动
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    tabRefs.current[active]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  return { active, direction, go, tabRefs };
}
