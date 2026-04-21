'use client';

import { useEffect } from 'react';

// 模块级单例状态：多个 hook 消费者共用；只有第一个锁定者记录 scrollY，
// 最后一个解锁者恢复。避免 lightbox + 菜单同时打开时 scroll 乱跳。
let lockCount = 0;
let savedScrollY = 0;

/**
 * 锁定页面滚动的 Hook
 * 用于 Modal、BottomSheet 等需要阻止背景滚动的场景
 * 支持嵌套调用：仅首次锁定时应用样式，最后一次解锁时恢复
 *
 * @param isLocked - 是否锁定，默认 true
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    lockCount++;
    if (lockCount === 1) {
      savedScrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
    }

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = '';
        document.body.style.overscrollBehavior = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isLocked]);
}
