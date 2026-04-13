'use client';

import { useInViewOnce } from '@/hooks/useInViewOnce';
import { type Locale } from '@/i18n/config';
import { type ProjectStage } from '@/data/projects';
import { useTranslations } from 'next-intl';

interface Props {
  stages: ProjectStage[];
  locale: Locale;
}

export default function RecoveryJourney({ stages, locale }: Props) {
  const t = useTranslations('projectDetail');
  const { ref, isVisible } = useInViewOnce<HTMLElement>();

  return (
    <section ref={ref} className="mt-14 sm:mt-16">
      {/* 标题区：装饰线 + 居中小标题 */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-ukraine-blue-100/60" />
        <h2 className="shrink-0 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.25em] text-ukraine-blue-400">
          {t('stagesTitle')}
        </h2>
        <div className="h-px flex-1 bg-ukraine-blue-100/60" />
      </div>

      {/* 时间线卡片 */}
      <div className="mt-6 rounded-2xl border border-ukraine-blue-100/40 bg-white/60 px-5 py-8 backdrop-blur-sm sm:px-8 sm:py-10 lg:px-10">
        {/* ── 桌面端：水平时间线 (lg+) ── */}
        <div className="hidden lg:block">
          <div className="relative flex justify-between">
            {/* 背景连接线 — 贯穿所有节点 */}
            <div
              className="pointer-events-none absolute top-6 left-6 right-6 h-[2px] gradient-brand-line"
              style={{
                opacity: 0.35,
                transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left center',
                transition:
                  'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />

            {stages.map((stage, i) => (
              <div
                key={i}
                className="relative flex w-1/5 flex-col items-center px-2"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translateY(0)'
                    : 'translateY(14px)',
                  transition:
                    'opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1), transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                  transitionDelay: `${0.25 + i * 0.13}s`,
                }}
              >
                {/* 编号圆点 */}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ukraine-blue-500 to-ukraine-blue-300 shadow-[0_2px_14px_rgba(0,108,178,0.28)] transition-shadow duration-300 hover:shadow-[0_4px_24px_rgba(0,108,178,0.4)]">
                  <span className="font-[family-name:var(--font-data)] text-sm font-bold text-white">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* 阶段标题 */}
                <h3 className="mt-4 text-center font-[family-name:var(--font-display)] text-[13px] font-semibold leading-snug text-ukraine-blue-900">
                  {stage.title[locale]}
                </h3>

                {/* 阶段描述 */}
                <p className="mt-1.5 max-w-[170px] text-center text-[11px] leading-relaxed text-ukraine-blue-700/60">
                  {stage.description[locale]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 移动端 / 平板端：垂直时间线 (<lg) ── */}
        <div className="lg:hidden">
          {stages.map((stage, i) => {
            const isLast = i === stages.length - 1;

            return (
              <div
                key={i}
                className="relative flex gap-4"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translateY(0)'
                    : 'translateY(10px)',
                  transition:
                    'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                  transitionDelay: `${0.15 + i * 0.1}s`,
                }}
              >
                {/* 左列：节点 + 连接线 */}
                <div className="flex flex-col items-center">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ukraine-blue-500 to-ukraine-blue-300 shadow-[0_2px_10px_rgba(0,108,178,0.25)]">
                    <span className="font-[family-name:var(--font-data)] text-xs font-bold text-white">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  {!isLast && (
                    <div className="my-1.5 w-[2px] flex-1 rounded-full gradient-brand-line opacity-30" />
                  )}
                </div>

                {/* 右列：标题 + 描述 */}
                <div className={`pt-2 ${isLast ? 'pb-0' : 'pb-6'}`}>
                  <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-ukraine-blue-900">
                    {stage.title[locale]}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-ukraine-blue-700/60">
                    {stage.description[locale]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
