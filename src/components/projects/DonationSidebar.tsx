'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Heart, Loader2 } from 'lucide-react';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useState } from 'react';
import { createCheckoutSession } from '@/app/actions/donate';

interface DonationSidebarProps {
  goalAmount: number | null;
  raisedAmount: number;
  projectId: number;
}

// 预设金额选项（UAH）
const AMOUNT_OPTIONS = [100, 500, 1000, 5000];

function formatCurrency(amount: number) {
  return `₴${amount.toLocaleString('uk-UA')}`;
}

export default function DonationSidebar({
  goalAmount,
  raisedAmount,
  projectId,
}: DonationSidebarProps) {
  const t = useTranslations('projectDetail');
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>();

  const locale = useLocale();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const progress = goalAmount
    ? Math.min((raisedAmount / goalAmount) * 100, 100)
    : 0;

  // 当前选择的金额
  const currentAmount = isCustom
    ? (parseFloat(customAmount) || 0)
    : (selectedAmount || 0);

  const handleQuickSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomInput = (value: string) => {
    // 只允许数字
    const cleaned = value.replace(/[^\d]/g, '');
    setCustomAmount(cleaned);
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const handleDonate = async () => {
    if (currentAmount <= 0 || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await createCheckoutSession(projectId, Math.floor(currentAmount), locale);
      if ('url' in result) {
        window.location.href = result.url;
      } else {
        setError(t('donationError'));
      }
    } catch {
      setError(t('donationError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-ukraine-blue-100/60 bg-white/90 shadow-[0_4px_24px_rgba(0,108,178,0.08)] backdrop-blur-sm"
    >
      {/* 顶部渐变装饰线 */}
      <div className="h-1 gradient-brand-line" />

      <div className="p-5 sm:p-6">
        {/* ── 进度区 ── */}
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
                  width: isVisible ? `${Math.max(progress, 2)}%` : '0%',
                  transitionDelay: '0.3s',
                }}
              >
                {/* 进度条末端光点 */}
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

        {/* ── 金额选择 ── */}
        <div>
          <label className="block font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-blue-500 mb-3">
            {t('selectAmount')}
          </label>

          {/* 快选按钮 */}
          <div className="grid grid-cols-4 gap-2">
            {AMOUNT_OPTIONS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickSelect(amount)}
                className={`cursor-pointer rounded-lg border px-2 py-2.5 font-[family-name:var(--font-data)] text-sm font-semibold transition-all duration-200 ${
                  selectedAmount === amount && !isCustom
                    ? 'border-ukraine-blue-500 bg-ukraine-blue-500 text-white shadow-[0_2px_8px_rgba(0,108,178,0.3)]'
                    : 'border-ukraine-blue-100 bg-ukraine-blue-50/40 text-ukraine-blue-700 hover:border-ukraine-blue-300 hover:bg-ukraine-blue-50'
                }`}
              >
                {amount >= 1000 ? `${amount / 1000}K` : amount} ₴
              </button>
            ))}
          </div>

          {/* 自定义金额输入 */}
          <div className="relative mt-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-[family-name:var(--font-data)] text-sm font-semibold text-ukraine-blue-400">
              ₴
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={customAmount}
              onChange={(e) => handleCustomInput(e.target.value)}
              onFocus={() => {
                setIsCustom(true);
                setSelectedAmount(null);
              }}
              placeholder={t('customAmount')}
              className={`w-full rounded-lg border py-2.5 pl-8 pr-4 font-[family-name:var(--font-data)] text-sm transition-all duration-200 outline-none ${
                isCustom && customAmount
                  ? 'border-ukraine-blue-500 bg-white ring-2 ring-ukraine-blue-500/20'
                  : 'border-ukraine-blue-100 bg-ukraine-blue-50/30 focus:border-ukraine-blue-300 focus:bg-white focus:ring-2 focus:ring-ukraine-blue-500/10'
              }`}
            />
          </div>
        </div>

        {/* ── 错误提示 ── */}
        {error && (
          <p className="mt-3 text-center text-sm text-red-500">{error}</p>
        )}

        {/* ── Donate 按钮 ── */}
        <button
          onClick={handleDonate}
          disabled={currentAmount <= 0 || isLoading}
          className={`gradient-brand mt-5 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl py-3.5 font-semibold text-white transition-opacity ${
            currentAmount <= 0 || isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:opacity-90'
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <Heart className="h-4 w-4" strokeWidth={2.5} />
          )}
          {isLoading
            ? t('processing')
            : currentAmount > 0
              ? `${t('donateButton')} · ${formatCurrency(currentAmount)}`
              : t('donateButton')}
        </button>
      </div>
    </div>
  );
}
