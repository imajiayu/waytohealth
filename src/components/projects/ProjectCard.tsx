'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { type Locale } from '@/i18n/config';
import { type ProjectData } from '@/data/projects';
import { ArrowUpRight, Heart } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

interface ProjectCardProps {
  id: number;
  data: ProjectData;
  cover: string;
  index: number; // 用于交错动画
  compact?: boolean; // 紧凑模式：更小的卡片
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

// 完整格式（用于 goal 显示）
function formatGoal(amount: number, currency: string) {
  const symbol = currency === 'UAH' ? '₴' : currency;
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

export default function ProjectCard({ id, data, cover, index, compact }: ProjectCardProps) {
  const t = useTranslations('projects');
  const locale = useLocale() as Locale;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const title = data.title[locale];
  const description = data.description[locale];
  const progress = data.goal_amount
    ? Math.min((data.raised_amount / data.goal_amount) * 100, 100)
    : 0;

  // 滚动入场动画
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="opacity-0 translate-y-8"
      style={{
        animation: isVisible
          ? `projectCardIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.12}s forwards`
          : 'none',
      }}
    >
      <Link
        href={`/projects/${id}`}
        className={`group relative flex flex-col overflow-hidden bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-12px_rgba(0,108,178,0.15)] ${compact ? 'rounded-xl' : 'rounded-2xl'}`}
        style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        {/* 封面图 */}
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes={compact ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          />
          {/* 底部渐变遮罩 — 增强文字对比 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* 项目序号标签 */}
          <div className={`absolute flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm ${compact ? 'top-2.5 left-2.5 h-6 w-6' : 'top-4 left-4 h-8 w-8'}`}>
            <span className={`font-[family-name:var(--font-data)] font-bold text-ukraine-blue-600 ${compact ? 'text-[0.6rem]' : 'text-xs'}`}>
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* 内容区 */}
        <div className={`flex flex-1 flex-col ${compact ? 'p-3 sm:p-4' : 'p-5 sm:p-6'}`}>
          {/* 标题 */}
          <h3 className={`font-[family-name:var(--font-display)] font-bold tracking-tight text-gray-900 ${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'}`}>
            {title}
          </h3>

          {/* 描述 */}
          <p className={`line-clamp-2 leading-relaxed text-gray-500 ${compact ? 'mt-1.5 text-xs' : 'mt-2.5 text-[0.9rem]'}`}>
            {description}
          </p>

          {/* 进度 + 金额 — 紧贴底部 */}
          <div className={`mt-auto ${compact ? 'pt-3' : 'pt-5'}`}>
            {/* 进度条 — 精细线条风格 */}
            {data.goal_amount && (
              <div className="relative">
                <div className="h-1 w-full overflow-hidden rounded-full bg-ukraine-blue-50">
                  <div
                    className="gradient-brand-progress relative h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  >
                    {/* 进度条末端光点 */}
                    <div className={`absolute -right-1 top-1/2 -translate-y-1/2 rounded-full bg-ukraine-blue-300 shadow-[0_0_8px_rgba(0,167,189,0.5)] ${compact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`} />
                  </div>
                </div>

                {/* 金额行 */}
                <div className={`flex items-baseline justify-between ${compact ? 'mt-2' : 'mt-2.5'}`}>
                  <span className={`font-[family-name:var(--font-data)] font-semibold text-ukraine-blue-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {formatAmount(data.raised_amount, data.currency)}
                  </span>
                  <span className={`font-[family-name:var(--font-data)] text-gray-400 ${compact ? 'text-[0.65rem]' : 'text-xs'}`}>
                    {t('goalOf')} {formatGoal(data.goal_amount, data.currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Donate 按钮 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/${locale}/donate?project=${id}`;
              }}
              className={`flex w-full items-center justify-center font-semibold transition-all duration-300 cursor-pointer bg-ukraine-blue-500 text-white hover:bg-ukraine-blue-400 hover:shadow-[0_4px_20px_rgba(0,108,178,0.25)] active:scale-[0.98] ${compact ? 'mt-3 gap-1.5 rounded-lg py-2 text-xs' : 'mt-4 gap-2.5 rounded-xl py-3 text-sm'}`}
            >
              <Heart className={compact ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={2.5} />
              {t('donateButton')}
              <ArrowUpRight className={compact ? 'h-2.5 w-2.5 opacity-60' : 'h-3.5 w-3.5 opacity-60'} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
