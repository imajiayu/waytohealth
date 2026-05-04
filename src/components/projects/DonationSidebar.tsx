'use client';

import { useTranslations } from 'next-intl';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import MethodStep from './donation/MethodStep';
import StripeStep from './donation/StripeStep';
import { useDonationFlow } from './donation/useDonationFlow';
import { formatCurrency } from './donation/utils';

interface DonationSidebarProps {
  goalAmount: number | null;
  raisedAmount: number;
  projectTitle: string;
  monobankJarSendId?: string;
}

export default function DonationSidebar({
  goalAmount,
  raisedAmount,
  projectTitle,
  monobankJarSendId,
}: DonationSidebarProps) {
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>();
  const t = useTranslations('projectDetail');
  const flow = useDonationFlow();

  // 真实百分比给文字用；进度条宽度另截到 100 防 overflow
  const progress = goalAmount ? (raisedAmount / goalAmount) * 100 : 0;
  const progressBarWidth = Math.min(progress, 100);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-ukraine-blue-100/60 bg-white/90 shadow-[0_4px_24px_rgba(0,108,178,0.08)] backdrop-blur-sm"
    >
      {/* 顶部渐变装饰线 */}
      <div className="h-1 gradient-brand-line" />

      <div className="p-5 sm:p-6">
        {/* ── 进度区（始终显示在顶部，视图切换不影响） ── */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-blue-400">
              {t('raisedLabel')}
            </span>
            <div className="mt-0.5 font-[family-name:var(--font-data)] text-xl font-bold text-ukraine-blue-900 sm:text-2xl">
              {formatCurrency(raisedAmount)}
            </div>
          </div>
          {goalAmount && (
            <div className="text-right">
              <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-blue-400">
                {t('goalLabel')}
              </span>
              <div className="mt-0.5 font-[family-name:var(--font-data)] text-base font-semibold text-ukraine-blue-600">
                {formatCurrency(goalAmount)}
              </div>
            </div>
          )}
        </div>

        {/* 进度条 */}
        {goalAmount && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-ukraine-blue-50">
              <div
                className="gradient-brand-progress relative h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: isVisible ? `${Math.max(progressBarWidth, 2)}%` : '0%',
                  transitionDelay: '0.3s',
                }}
              >
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-ukraine-blue-300 shadow-[0_0_12px_rgba(0,167,189,0.5)]" />
              </div>
            </div>
            <div className="mt-1.5 text-right font-[family-name:var(--font-data)] text-[11px] text-ukraine-blue-400">
              {Math.round(progress)}%
            </div>
          </div>
        )}

        {/* ── 分隔线 ── */}
        <div className="my-5 h-px bg-ukraine-blue-100/60" />

        {/* ── 视图切换：method ↔ stripe ── */}
        {flow.view === 'method' ? (
          <MethodStep
            key="method"
            animationClass={flow.animationClass}
            projectTitle={projectTitle}
            monobankJarSendId={monobankJarSendId}
            onStripeSelect={flow.goToStripe}
          />
        ) : (
          <StripeStep
            key="stripe"
            animationClass={flow.animationClass}
            projectTitle={projectTitle}
            onBack={flow.back}
          />
        )}
      </div>
    </div>
  );
}
