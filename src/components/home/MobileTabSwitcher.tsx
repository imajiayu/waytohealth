'use client';

import { Children, useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface MobileTabItem {
  /** 唯一 key */
  key: string | number;
  /** a11y 名称（thumbnail 模式还会作为可见 caption） */
  label: string;
  /** tab 内自渲染的内容（图片 / 文字卡片 / 任意 ReactNode） */
  thumbnail: ReactNode;
  /** 激活态外环颜色（CSS 颜色值），未传时使用品牌蓝 */
  activeAccent?: string;
}

/**
 * - thumbnail：76px 方形 + 下方文字 caption + 激活底线（图片 tab 用）
 * - card：尺寸由 thumbnail 自身决定，无 caption / 底线（纯文字 tab 用）
 */
type Variant = 'thumbnail' | 'card';

interface MobileTabSwitcherProps {
  tabs: MobileTabItem[];
  /** tablist 的 a11y 名称，例如 "Values" / "Achievements" */
  ariaLabel: string;
  variant?: Variant;
  /** 与 tabs 一一对应的 panel 内容 */
  children: ReactNode;
}

/**
 * 移动端通用 tab 切换器：上方横向滚动 tab 栏 + 下方一张当前 panel。
 * 复用 MobileProjectSwitcher 的交互模式，tab 内容由调用方自由渲染，
 * 激活外环颜色支持按 tab 自定义（accent token）。
 *
 * 只在 sm 以下使用；更大屏由调用方渲染原本的多列布局。
 */
export default function MobileTabSwitcher({
  tabs,
  ariaLabel,
  variant = 'thumbnail',
  children,
}: MobileTabSwitcherProps) {
  const cards = Children.toArray(children);
  const count = cards.length;

  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const didMountRef = useRef(false);
  const baseId = useId();

  const go = useCallback(
    (next: number) => {
      if (next === active || next < 0 || next >= count) return;
      setDirection(next > active ? 'forward' : 'backward');
      setActive(next);
    },
    [active, count],
  );

  // 激活项自动居中到视口
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const el = tabRefs.current[active];
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  return (
    <div>
      {/* tab 栏：thumbnail 走横向滚动（左右 spacer 比 padding 可靠）；
          card 走非滚动 3 等分（项数少，直接写死布局，不用滚动） */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'pb-4 pt-2',
          variant === 'card' ? '' : 'hide-scrollbar -mx-4 overflow-x-auto',
        )}
      >
        <div className="flex gap-3">
          {variant !== 'card' && <div className="w-4 shrink-0" aria-hidden />}
          {tabs.map((t, i) => {
            const isActive = active === i;
            const accent = t.activeAccent ?? 'var(--color-ukraine-blue-500)';
            const ringStyle: React.CSSProperties = isActive
              ? {
                  boxShadow:
                    variant === 'card'
                      ? `0 0 0 2px ${accent}, 0 6px 18px -6px color-mix(in srgb, ${accent} 45%, transparent)`
                      : `0 0 0 2px white, 0 0 0 4px ${accent}, 0 6px 18px -6px color-mix(in srgb, ${accent} 45%, transparent)`,
                }
              : {};

            return (
              <button
                key={t.key}
                id={`${baseId}-tab-${i}`}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${baseId}-panel-${i}`}
                aria-label={t.label}
                onClick={() => go(i)}
                className={cn(
                  'group outline-none',
                  variant === 'card'
                    ? 'block min-w-0 flex-1'
                    : 'flex w-[76px] shrink-0 flex-col items-start gap-2 text-left',
                )}
              >
                {/* 缩略图容器 —— 激活态外环用 box-shadow 模拟 ring 效果（动态颜色 Tailwind ring 类不支持） */}
                <div
                  className={cn(
                    'relative overflow-hidden rounded-xl transition-all duration-300',
                    variant === 'card' ? '' : 'aspect-square w-full',
                    !isActive &&
                      'opacity-55 group-hover:opacity-85 group-focus-visible:opacity-85',
                  )}
                  style={ringStyle}
                >
                  {t.thumbnail}
                </div>

                {/* card variant 不渲染 caption / 底线（label 由 thumbnail 自渲染） */}
                {variant === 'thumbnail' && (
                  <>
                    <span
                      className={cn(
                        'line-clamp-2 min-h-[2.2em] text-[10.5px] font-semibold leading-tight tracking-tight transition-colors',
                        isActive ? 'text-ukraine-blue-900' : 'text-gray-400',
                      )}
                    >
                      {t.label}
                    </span>

                    <span
                      className={cn(
                        'h-[2px] rounded-full transition-all duration-300',
                        isActive ? 'w-5' : 'w-0',
                      )}
                      style={isActive ? { background: accent } : undefined}
                      aria-hidden
                    />
                  </>
                )}
              </button>
            );
          })}
          {variant !== 'card' && <div className="w-4 shrink-0" aria-hidden />}
        </div>
      </div>

      {/* 当前 panel：定向滑入动画 */}
      <div
        key={active}
        id={`${baseId}-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className={
          direction === 'forward' ? 'animate-panel-forward' : 'animate-panel-backward'
        }
      >
        {cards[active]}
      </div>
    </div>
  );
}
