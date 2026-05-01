'use client';

import { Children, useCallback, useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AchievementTab {
  key: number;
  label: string;
  accent: {
    dot: string;
    eyebrow: string;
    soft: string;
  };
}

interface Props {
  tabs: AchievementTab[];
  ariaLabel: string;
  /** 与 tabs 一一对应的 panel 内容 */
  children: ReactNode;
}

/**
 * 移动端 achievements 专用 tab：4 等分横向扁平 tab bar（不滚动）。
 * 文字水平排布、底部 accent 下划线表激活，视觉刻意区别于
 * 首页项目选择器的图片缩略图与 Values 的填充矩形卡。
 */
export default function MobileAchievementsTabs({
  tabs,
  ariaLabel,
  children,
}: Props) {
  const cards = Children.toArray(children);
  const count = cards.length;
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const baseId = useId();

  const go = useCallback(
    (next: number) => {
      if (next === active || next < 0 || next >= count) return;
      setDirection(next > active ? 'forward' : 'backward');
      setActive(next);
    },
    [active, count],
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex border-b border-ukraine-blue-100/70"
      >
        {tabs.map((tab, i) => {
          const isActive = active === i;
          const { dot, eyebrow } = tab.accent;
          return (
            <button
              key={tab.key}
              id={`${baseId}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${i}`}
              aria-label={tab.label}
              onClick={() => go(i)}
              className={cn(
                'group relative -mb-px min-w-0 flex-1 px-1 pb-2.5 pt-3 text-center outline-none transition-colors',
                'border-b-2',
                isActive ? '' : 'border-transparent',
              )}
              style={isActive ? { borderColor: dot } : undefined}
            >
              <span
                className={cn(
                  'line-clamp-2 break-words text-[11px] font-semibold leading-[1.2] tracking-tight transition-colors',
                  isActive ? '' : 'text-gray-400 group-hover:text-ukraine-blue-700',
                )}
                style={isActive ? { color: eyebrow } : undefined}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div
        key={active}
        id={`${baseId}-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className={cn(
          'pt-5',
          direction === 'forward' ? 'animate-panel-forward' : 'animate-panel-backward',
        )}
      >
        {cards[active]}
      </div>
    </div>
  );
}
