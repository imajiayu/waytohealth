'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface BottomSheetProps {
  isOpen: boolean;
  children: React.ReactNode;
  minimizedHint: string; // 最小化时显示的文案
  hideWhenMinimized?: boolean; // 最小化时完全隐藏（用于显示页脚）
  expandTrigger?: number; // 递增触发展开（外部控制）
}

// 常量
const NAV_BAR_HEIGHT = 64; // px - 导航栏高度
const MINIMIZED_HEIGHT = 64; // px - 最小化按钮栏高度
const DRAG_THRESHOLD_RATIO = 0.1; // 10% 视口高度

export default function BottomSheet({
  isOpen,
  children,
  minimizedHint,
  hideWhenMinimized = false,
  expandTrigger,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const hasDraggedRef = useRef(false);
  const [currentSnap, setCurrentSnap] = useState(0); // 从最小化开始
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // 计算 snap point 像素值（SSR 安全）
  const getSnapHeight = useCallback((snapIndex: number) => {
    if (typeof window === 'undefined') return MINIMIZED_HEIGHT;
    if (snapIndex === 1) {
      // 全屏：导航栏以下
      return window.innerHeight - NAV_BAR_HEIGHT;
    }
    // 最小化：仅按钮栏高度
    return MINIMIZED_HEIGHT;
  }, []);

  const isMinimized = currentSnap === 0;
  const isExpanded = currentSnap === 1;

  // 拖拽开始
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setCurrentY(clientY);
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);

    const dragDistance = currentY - startY;
    const vh = window.innerHeight;
    const dragThreshold = vh * DRAG_THRESHOLD_RATIO;

    // 标记是否发生了真实拖拽（距离 > 5px），防止 click 事件撤销拖拽结果
    if (Math.abs(dragDistance) > 5) {
      hasDraggedRef.current = true;
    }

    // 根据拖拽方向切换状态
    if (dragDistance > dragThreshold) {
      // 向下拖 - 最小化
      setCurrentSnap(0);
    } else if (dragDistance < -dragThreshold) {
      // 向上拖 - 展开
      setCurrentSnap(1);
    }
  }, [currentY, startY]);

  // 切换状态（跳过刚完成拖拽后的 click 事件）
  const toggleSheet = useCallback(() => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    setCurrentSnap(prev => (prev === 0 ? 1 : 0));
  }, []);

  // 外部命令式触发展开：父级递增 expandTrigger → 展开到全屏 snap。
  // set-state-in-effect 是故意的，这就是 prop→state 的同步点。
  useEffect(() => {
    if (expandTrigger && expandTrigger > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentSnap(1);
    }
  }, [expandTrigger]);

  // 鼠标事件
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart]
  );

  // 添加/移除拖拽事件监听器
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCurrentY(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      setCurrentY(e.touches[0].clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    const handleTouchEnd = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDragEnd]);

  // 检测移动端断点 —— 用 matchMedia 订阅变化，比 resize 高效且与 CSS 媒体查询断点一致
  const isMobile = useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia('(max-width: 1023.98px)');
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia('(max-width: 1023.98px)').matches,
    () => false, // SSR 默认桌面，hydrate 后再纠正
  );

  // 展开时锁定背景滚动（仅移动端）
  useBodyScrollLock(isOpen && isExpanded && isMobile);

  // 展开时聚焦以支持无障碍访问
  useEffect(() => {
    if (isExpanded && sheetRef.current) {
      sheetRef.current.focus();
    }
  }, [isExpanded]);

  if (!isOpen) return null;

  // 最小化且隐藏时完全不显示
  const shouldHide = isMinimized && hideWhenMinimized;

  const currentHeight = getSnapHeight(currentSnap);

  // Spring 弹簧缓动
  const springTransition = 'cubic-bezier(0.32, 0.72, 0, 1)';

  // 拖拽偏移量
  const dragOffset = isDragging ? Math.max(0, currentY - startY) : 0;

  return (
    <>
      {/* CTA 按钮 - 最小化时显示在屏幕底部 */}
      {isMinimized && !shouldHide && (
        <button
          type="button"
          className="fixed left-0 right-0 z-40 cursor-pointer select-none bg-transparent border-none p-0"
          onClick={toggleSheet}
          style={{
            // iOS safe-area 适配
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
          }}
        >
          <div className="gradient-brand flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl mx-4 font-semibold text-white shadow-brand-cta">
            <ChevronUp className="h-5 w-5" />
            <span className="text-base">
              {minimizedHint}
            </span>
            <ChevronUp className="h-5 w-5" />
          </div>
        </button>
      )}

      {/* Sheet 面板 - 展开时覆盖屏幕，收起时向下滑出 */}
      <div
        ref={sheetRef}
        role={isExpanded ? 'dialog' : undefined}
        aria-modal={isExpanded || undefined}
        aria-hidden={isMinimized}
        tabIndex={-1}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 outline-none"
        style={{
          height: `${currentHeight}px`,
          maxHeight: '95vh',
          // 用 translateY 实现向下滑动收起
          transform: isDragging
            ? `translateY(${dragOffset}px)`
            : isMinimized
              ? 'translateY(100%)'
              : 'translateY(0)',
          transition: isDragging
            ? 'none'
            : `transform 400ms ${springTransition}`,
          boxShadow: isExpanded
            ? '0 -8px 40px -12px rgba(0, 0, 0, 0.25), 0 -4px 16px -8px rgba(0, 0, 0, 0.1)'
            : 'none',
        }}
      >
        {/* 拖拽手柄 - 向下箭头 */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Toggle donation panel"
          className="cursor-pointer touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-ukraine-gold-500"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={toggleSheet}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSheet();
            }
          }}
        >
          <div className="pt-2 pb-1 flex items-center justify-center">
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* 内容区 */}
        <div
          className="overflow-y-auto bg-white"
          style={{ height: 'calc(100% - 28px)' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
