'use client';

import { useInViewOnce } from '@/hooks/useInViewOnce';
import AmountStep from './donation/AmountStep';
import MethodStep from './donation/MethodStep';
import StripeStep from './donation/StripeStep';
import { useDonationFlow } from './donation/useDonationFlow';

interface DonationSidebarProps {
  goalAmount: number | null;
  raisedAmount: number;
  projectTitle: string;
  monobankJarSendId?: string;
  eurRate: number | null;
}

export default function DonationSidebar({
  goalAmount,
  raisedAmount,
  projectTitle,
  monobankJarSendId,
  eurRate,
}: DonationSidebarProps) {
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>();
  const flow = useDonationFlow();

  const progress = goalAmount
    ? Math.min((raisedAmount / goalAmount) * 100, 100)
    : 0;

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-ukraine-blue-100/60 bg-white/90 shadow-[0_4px_24px_rgba(0,108,178,0.08)] backdrop-blur-sm"
    >
      {/* 顶部渐变装饰线 */}
      <div className="h-1 gradient-brand-line" />

      <div className="p-5 sm:p-6">
        {flow.view === 'amount' ? (
          <AmountStep
            key="amount"
            goalAmount={goalAmount}
            raisedAmount={raisedAmount}
            progress={progress}
            isVisible={isVisible}
            animationClass={flow.animationClass}
            selectedAmount={flow.selectedAmount}
            customAmount={flow.customAmount}
            isCustom={flow.isCustom}
            currentAmount={flow.currentAmount}
            onQuickSelect={flow.quickSelect}
            onCustomInput={flow.customInput}
            onCustomFocus={flow.customFocus}
            onDonate={flow.goToMethod}
          />
        ) : flow.view === 'method' ? (
          <MethodStep
            key="method"
            animationClass={flow.animationClass}
            amount={Math.floor(flow.currentAmount)}
            projectTitle={projectTitle}
            monobankJarSendId={monobankJarSendId}
            onBack={flow.back}
            onStripeSelect={flow.goToStripe}
            error={flow.error}
          />
        ) : (
          <StripeStep
            key="stripe"
            animationClass={flow.animationClass}
            amount={Math.floor(flow.currentAmount)}
            projectTitle={projectTitle}
            eurRate={eurRate}
            onBack={flow.back}
          />
        )}
      </div>
    </div>
  );
}
