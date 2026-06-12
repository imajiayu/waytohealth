import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { toLocale } from '@/i18n/config';
import { type ProjectWithRaised } from '@/data/projects';
import { ArrowUpRight } from 'lucide-react';
import FadeInOnView from '@/components/common/FadeInOnView';
import { formatCompactAmount } from './donation/utils';

interface ProjectCardProps {
  id: number;
  data: ProjectWithRaised;
  cover: string;
  index: number; // 用于交错动画
  compact?: boolean; // 紧凑模式：图片全覆盖 + 叠加文字
  skipFadeIn?: boolean; // 跳过外层 FadeInOnView 包裹（在自带切换动画的容器中使用，避免动画叠加）
}

export default async function ProjectCard({ id, data, cover, index, compact, skipFadeIn }: ProjectCardProps) {
  const [t, rawLocale] = await Promise.all([
    getTranslations('projects'),
    getLocale(),
  ]);
  const locale = toLocale(rawLocale);

  const title = data.title[locale];
  const description = data.description[locale];
  // 真实百分比给徽章文字用；进度条宽度另截到 100 防 overflow
  const progress = data.goal_amount ? (data.raised_amount / data.goal_amount) * 100 : 0;
  const progressBarWidth = Math.min(progress, 100);

  // 条件包裹：skipFadeIn 时直接返回内容，由外层控制入场动画
  const wrap = (node: React.ReactNode) =>
    skipFadeIn ? <>{node}</> : <FadeInOnView delayIndex={index}>{node}</FadeInOnView>;

  /* ── 紧凑模式：图片全覆盖 + 底部渐变叠加文字 ── */
  if (compact) {
    return wrap(
      <Link
        href={`/projects?id=${id}`}
        className="group relative block aspect-[4/5] overflow-hidden rounded-xl"
      >
        {/* alt="" 装饰图：标题在图上叠加可见，给 alt 会与可见标题重复（Lighthouse redundant-alt） */}
        <Image
          src={cover}
          alt=""
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          sizes="(max-width: 1024px) 33vw, 20vw"
        />
        {/* 底部渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

        {/* 叠加内容 */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col p-3 sm:p-4">
          <h3 className="font-[family-name:var(--font-display)] text-sm font-bold leading-tight text-white sm:text-base">
            {title}
          </h3>
          {/* 白色薄进度条 */}
          {data.goal_amount && progress > 0 && (
            <div className="mt-2.5 h-[2px] w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white/90"
                style={{ width: `${Math.max(progressBarWidth, 3)}%` }}
              />
            </div>
          )}
        </div>
      </Link>
    );
  }

  /* ── 标准模式：编辑式简洁卡片 ── */
  return wrap(
    <Link
      href={`/projects?id=${id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_40px_-8px_rgba(0,108,178,0.14)]"
      style={{
        boxShadow:
          '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* 封面图 — 8:5 宽幅比例 */}
      <div className="relative aspect-[8/5] w-full overflow-hidden">
        {/* alt="" 装饰图：标题在卡片内紧邻可见（下方 h3），给 alt 会重复（Lighthouse redundant-alt） */}
        <Image
          src={cover}
          alt=""
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* 百分比毛玻璃徽章 — 浮于图片右下角 */}
        {data.goal_amount && progress > 0 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-white/80 px-2.5 py-1 font-[family-name:var(--font-data)] text-[11px] font-bold text-ukraine-blue-600 shadow-sm backdrop-blur-md">
            {Math.round(progress)}%
          </div>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* 标题 */}
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold leading-tight tracking-tight text-gray-900 sm:text-xl">
          {title}
        </h3>

        {/* 描述 */}
        <p className="mt-2 line-clamp-2 text-[0.875rem] leading-relaxed text-gray-500">
          {description}
        </p>

        {/* 底部：进度条 + 金额 + 箭头 */}
        <div className="mt-auto pt-5">
          {/* 进度条 — 4px，末端光点 */}
          {data.goal_amount && (
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-ukraine-blue-50">
              <div
                className="gradient-brand-progress relative h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(progressBarWidth, 2)}%` }}
              >
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-ukraine-blue-300 shadow-[0_0_8px_rgba(0,167,189,0.5)]" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            {data.goal_amount ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-[family-name:var(--font-data)] text-sm font-semibold text-ukraine-blue-500">
                  {formatCompactAmount(data.raised_amount, data.currency)}
                </span>
                <span className="font-[family-name:var(--font-data)] text-xs text-gray-400">
                  / {formatCompactAmount(data.goal_amount, data.currency)}
                </span>
              </div>
            ) : (
              <span className="font-[family-name:var(--font-data)] text-sm font-semibold text-ukraine-blue-500">
                {formatCompactAmount(data.raised_amount, data.currency)} {t('raised')}
              </span>
            )}

            {/* 圆形箭头 CTA */}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ukraine-blue-50 text-ukraine-blue-400 transition-all duration-300 group-hover:bg-ukraine-blue-500 group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(0,108,178,0.3)]">
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]"
                strokeWidth={2}
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
