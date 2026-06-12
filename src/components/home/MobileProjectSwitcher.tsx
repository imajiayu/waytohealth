'use client';

import { Children, type ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useMobileTabs } from '@/hooks/useMobileTabs';

interface ThumbItem {
  id: number;
  cover: string;
  title: string;
}

interface MobileProjectSwitcherProps {
  thumbs: ThumbItem[];
  children: ReactNode; // 预渲染的 ProjectCard 列表（skipFadeIn 传入）
}

/**
 * 移动端项目切换器：上方横向滚动缩略图导航 + 下方一张当前卡片。
 * 把"纵向 6 张大卡片"折叠成"1 张卡 + 导航条"，显著缩短首屏到下一个 section 的滚动距离。
 *
 * 只在 sm 以下可见；桌面端保持原 3 列网格。
 */
export default function MobileProjectSwitcher({
  thumbs,
  children,
}: MobileProjectSwitcherProps) {
  const cards = Children.toArray(children);
  const count = cards.length;

  const { active, direction, go, tabRefs } = useMobileTabs(count);

  return (
    <div>
      {/* 缩略图横向滚动导航 — 左右 spacer 比 padding-right 更可靠（Chrome/Safari 横滚容器会忽略 pr）；
          上下 padding 给 ring-offset 留出空间，避免裁切 */}
      <div
        role="tablist"
        aria-label="Projects"
        className="hide-scrollbar -mx-4 overflow-x-auto pb-4 pt-2"
      >
        <div className="flex gap-3">
          {/* 左侧 spacer：保证首张缩略图距离屏幕左缘 16px */}
          <div className="w-4 shrink-0" aria-hidden />
          {thumbs.map((t, i) => {
            const isActive = active === i;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={t.title}
                onClick={() => go(i)}
                className="group flex w-[76px] shrink-0 flex-col items-start gap-2 text-left outline-none"
              >
                {/* 缩略图 */}
                <div
                  className={cn(
                    'relative aspect-square w-full overflow-hidden rounded-xl transition-all duration-300',
                    isActive
                      ? 'shadow-[0_6px_18px_-6px_rgba(0,108,178,0.35)] ring-2 ring-ukraine-blue-500 ring-offset-2 ring-offset-transparent'
                      : 'opacity-55 group-hover:opacity-85 group-focus-visible:opacity-85',
                  )}
                >
                  <Image
                    src={t.cover}
                    alt=""
                    fill
                    sizes="76px"
                    className={cn(
                      'object-cover transition-transform duration-500',
                      isActive ? 'scale-[1.04]' : 'grayscale-[30%]',
                    )}
                  />
                  {/* 非激活蒙层：轻微蓝压暗 */}
                  {!isActive && (
                    <div
                      className="pointer-events-none absolute inset-0 bg-ukraine-blue-900/15"
                      aria-hidden
                    />
                  )}
                </div>

                {/* 标题 */}
                <span
                  className={cn(
                    'line-clamp-2 min-h-[2.2em] text-[10.5px] font-semibold leading-tight tracking-tight transition-colors',
                    isActive ? 'text-ukraine-blue-900' : 'text-gray-400',
                  )}
                >
                  {t.title}
                </span>

                {/* 激活底线 */}
                <span
                  className={cn(
                    'h-[2px] rounded-full transition-all duration-300',
                    isActive ? 'w-5 bg-ukraine-blue-500' : 'w-0 bg-transparent',
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
          {/* 右侧 spacer：保证末张缩略图距离屏幕右缘 16px（滚到底时不贴边） */}
          <div className="w-4 shrink-0" aria-hidden />
        </div>
      </div>

      {/* 当前卡片：定向滑入动画 */}
      <div
        key={active}
        role="tabpanel"
        aria-label={thumbs[active]?.title}
        className={
          direction === 'forward' ? 'animate-panel-forward' : 'animate-panel-backward'
        }
      >
        {cards[active]}
      </div>
    </div>
  );
}
