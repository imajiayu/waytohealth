'use client';

import { useEffect } from 'react';

/**
 * ESC 键关闭 modal / drawer 的通用 hook
 * @param active  hook 生效条件（例如 modal 打开时才监听）
 * @param onEscape  ESC 按下时的回调
 */
export function useEscapeKey(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onEscape();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, onEscape]);
}
