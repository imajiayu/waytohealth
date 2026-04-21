'use client';

import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { AMOUNT_OPTIONS, formatCurrency } from './utils';

interface AmountStepProps {
  goalAmount: number | null;
  raisedAmount: number;
  progress: number;
  isVisible: boolean;
  animationClass: string;
  selectedAmount: number | null;
  customAmount: string;
  isCustom: boolean;
  currentAmount: number;
  onQuickSelect: (amount: number) => void;
  onCustomInput: (value: string) => void;
  onCustomFocus: () => void;
  onDonate: () => void;
}

export default function AmountStep({
  goalAmount,
  raisedAmount,
  progress,
  isVisible,
  animationClass,
  selectedAmount,
  customAmount,
  isCustom,
  currentAmount,
  onQuickSelect,
  onCustomInput,
  onCustomFocus,
  onDonate,
}: AmountStepProps) {
  const t = useTranslations('projectDetail');

  return (
    <div className={animationClass}>
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

        <div className="grid grid-cols-4 gap-2">
          {AMOUNT_OPTIONS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onQuickSelect(amount)}
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

        <div className="relative mt-3">
          <label htmlFor="donate-custom-amount" className="sr-only">
            {t('customAmount')}
          </label>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-[family-name:var(--font-data)] text-sm font-semibold text-ukraine-blue-400">
            ₴
          </span>
          <input
            id="donate-custom-amount"
            type="text"
            inputMode="numeric"
            value={customAmount}
            onChange={(e) => onCustomInput(e.target.value)}
            onFocus={onCustomFocus}
            placeholder={t('customAmount')}
            className={`w-full rounded-lg border py-2.5 pl-8 pr-4 font-[family-name:var(--font-data)] text-sm transition-all duration-200 outline-none ${
              isCustom && customAmount
                ? 'border-ukraine-blue-500 bg-white ring-2 ring-ukraine-blue-500/20'
                : 'border-ukraine-blue-100 bg-ukraine-blue-50/30 focus:border-ukraine-blue-300 focus:bg-white focus:ring-2 focus:ring-ukraine-blue-500/10'
            }`}
          />
        </div>
      </div>

      {/* ── Donate 按钮 ── */}
      <button
        type="button"
        onClick={onDonate}
        disabled={currentAmount <= 0}
        className={`gradient-brand mt-5 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl py-3.5 font-semibold text-white transition-opacity ${
          currentAmount <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        <Heart className="h-4 w-4" strokeWidth={2.5} />
        {currentAmount > 0
          ? `${t('donateButton')} · ${formatCurrency(currentAmount)}`
          : t('donateButton')}
      </button>
    </div>
  );
}
