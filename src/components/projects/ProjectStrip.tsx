'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toLocale } from '@/i18n/config';
import { type ProjectWithRaised } from '@/data/projects';
import { useRef, useEffect, useState, useCallback } from 'react';

interface ProjectStripItem {
  id: number;
  data: ProjectWithRaised;
  cover: string;
}

interface ProjectStripProps {
  projects: ProjectStripItem[];
  currentId: number;
}

// 格式化金额：紧凑显示大数字
function formatAmount(amount: number, currency: string) {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${formatted}M ${currency === 'UAH' ? '₴' : currency}`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${formatted}K ${currency === 'UAH' ? '₴' : currency}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatGoal(amount: number, currency: string) {
  const symbol = currency === 'UAH' ? '₴' : currency;
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

export default function ProjectStrip({ projects, currentId }: ProjectStripProps) {
  const t = useTranslations('projects');
  const locale = toLocale(useLocale());
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // 滚动条状态
  const [thumbRatio, setThumbRatio] = useState(1); // thumb 宽度占轨道的比例
  const [thumbLeft, setThumbLeft] = useState(0);    // thumb 的 left 百分比
  const [canScroll, setCanScroll] = useState(false); // 是否需要显示滚动条

  // 根据容器滚动状态更新滚动条
  const updateScrollbar = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const hasOverflow = scrollWidth > clientWidth;
    setCanScroll(hasOverflow);
    if (!hasOverflow) return;
    setThumbRatio(clientWidth / scrollWidth);
    setThumbLeft((scrollLeft / scrollWidth) * 100);
  }, []);

  // 页面加载时自动滚动到当前项目
  useEffect(() => {
    const container = scrollRef.current;
    const activeEl = activeRef.current;
    if (!container || !activeEl) return;

    // 将当前项目卡片居中显示
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const scrollLeft =
      activeEl.offsetLeft - containerRect.width / 2 + activeRect.width / 2;

    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }, [currentId]);

  // 监听滚动和尺寸变化
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollbar();
    el.addEventListener('scroll', updateScrollbar, { passive: true });

    const ro = new ResizeObserver(updateScrollbar);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollbar);
      ro.disconnect();
    };
  }, [updateScrollbar]);

  // 点击轨道跳转到对应位置
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    const trackRect = track.getBoundingClientRect();
    const clickRatio = (e.clientX - trackRect.left) / trackRect.width;
    const targetScroll = clickRatio * el.scrollWidth - el.clientWidth / 2;
    el.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  // 拖拽 thumb 滚动
  const handleThumbDrag = useCallback(
    (startEvent: React.MouseEvent | React.TouchEvent) => {
      startEvent.preventDefault();
      startEvent.stopPropagation();
      const el = scrollRef.current;
      const track = trackRef.current;
      if (!el || !track) return;

      const trackRect = track.getBoundingClientRect();
      const thumbWidth = trackRect.width * (el.clientWidth / el.scrollWidth);
      const draggableWidth = trackRect.width - thumbWidth;
      const startX =
        'touches' in startEvent
          ? startEvent.touches[0].clientX
          : startEvent.clientX;
      const startScrollLeft = el.scrollLeft;

      const onMove = (e: MouseEvent | TouchEvent) => {
        const clientX =
          'touches' in e ? e.touches[0].clientX : e.clientX;
        const dx = clientX - startX;
        // thumb 可移动范围 = 轨道宽度 - thumb 宽度
        el.scrollLeft =
          startScrollLeft + (dx / draggableWidth) * (el.scrollWidth - el.clientWidth);
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      };

      document.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: true });
      document.addEventListener('touchend', onUp);
    },
    [],
  );

  return (
    <div>
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-4 overflow-x-auto px-1 py-2 sm:gap-5"
      >
        {projects.map((project) => {
          const isCurrent = project.id === currentId;
          const title = project.data.title[locale];
          // 进度条宽度截到 100 防 overflow（这张卡不展示百分比文字）
          const progressBarWidth = project.data.goal_amount
            ? Math.min((project.data.raised_amount / project.data.goal_amount) * 100, 100)
            : 0;

          return (
            <div
              key={project.id}
              ref={isCurrent ? activeRef : undefined}
              className="shrink-0"
            >
              <Link
                href={`/projects?id=${project.id}`}
                className={`group relative flex w-[240px] flex-col overflow-hidden rounded-xl border bg-white transition-all duration-300 sm:w-[272px] ${
                  isCurrent
                    ? 'border-ukraine-blue-400 ring-2 ring-ukraine-blue-400'
                    : 'border-gray-200 hover:-translate-y-1'
                }`}
              >
                {/* 封面图 */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={project.cover}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    sizes="(max-width: 640px) 240px, 272px"
                  />
                  {/* 当前项目标记 */}
                  {isCurrent && (
                    <div className="absolute top-2.5 right-2.5 rounded-full bg-ukraine-blue-500 px-2.5 py-0.5 font-[family-name:var(--font-data)] text-[10px] font-semibold text-white shadow-md">
                      {t('current')}
                    </div>
                  )}
                  {/* hover 遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>

                {/* 内容区 */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-1 font-[family-name:var(--font-display)] text-sm font-bold tracking-tight text-gray-900 sm:text-[0.938rem]">
                    {title}
                  </h3>

                  {/* 进度条 + 金额 */}
                  {project.data.goal_amount && (
                    <div className="mt-auto pt-3">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-ukraine-blue-50">
                        <div
                          className="gradient-brand-progress relative h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.max(progressBarWidth, 2)}%` }}
                        >
                          <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-ukraine-blue-300 shadow-[0_0_6px_rgba(0,167,189,0.5)]" />
                        </div>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-[family-name:var(--font-data)] text-xs font-semibold text-ukraine-blue-500">
                          {formatAmount(project.data.raised_amount, project.data.currency)}
                        </span>
                        <span className="font-[family-name:var(--font-data)] text-[10px] text-gray-400">
                          {t('goalOf')} {formatGoal(project.data.goal_amount, project.data.currency)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* 自定义滚动条 */}
      {canScroll && (
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="mt-3 hidden h-2 w-full cursor-pointer rounded-full bg-ukraine-blue-100 transition-[height] duration-150 lg:block"
        >
          <div
            onMouseDown={handleThumbDrag}
            onTouchStart={handleThumbDrag}
            className="gradient-brand-line h-full cursor-grab rounded-full active:cursor-grabbing"
            style={{
              width: `${thumbRatio * 100}%`,
              marginLeft: `${thumbLeft}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
