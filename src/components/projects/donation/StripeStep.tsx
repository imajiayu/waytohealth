'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Script from 'next/script';
import {
  formatCurrency,
  STRIPE_BUY_BUTTON_ID,
  STRIPE_PUBLISHABLE_KEY,
} from './utils';

interface StripeStepProps {
  animationClass: string;
  amount: number;
  projectTitle: string;
  eurRate: number | null;
  onBack: () => void;
}

export default function StripeStep({
  animationClass,
  amount,
  projectTitle,
  eurRate,
  onBack,
}: StripeStepProps) {
  const t = useTranslations('projectDetail');

  const eurAmount = eurRate && amount > 0 ? amount * eurRate : null;

  return (
    <div className={animationClass}>
      {/* Stripe buy-button web component 脚本 */}
      <Script src="https://js.stripe.com/v3/buy-button.js" strategy="afterInteractive" />

      {/* ── 顶部：返回 + 步骤序号 ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="group -ml-1 flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 font-[family-name:var(--font-data)] text-[11px] font-semibold uppercase tracking-[0.2em] text-ukraine-blue-500 transition-colors hover:text-ukraine-blue-700"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2.5}
          />
          {t('back')}
        </button>
        <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.25em] text-ukraine-blue-300">
          03 / 03
        </span>
      </div>

      {/* ── Stripe wordmark 作为视图标题 ── */}
      <div className="mt-4">
        <Image
          src="/logos/stripe.svg"
          alt="Stripe"
          width={360}
          height={150}
          className="h-7 w-auto"
          priority={false}
        />
      </div>

      {/* ── 金额徽章组：UAH 主 pill + EUR 换算 accent ── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-ukraine-blue-100 bg-ukraine-blue-50/60 px-3 py-1.5">
          <span className="font-[family-name:var(--font-data)] text-sm font-bold text-ukraine-blue-700">
            {formatCurrency(amount)}
          </span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-ukraine-blue-300" />
          <span className="truncate text-xs text-ukraine-blue-600">{projectTitle}</span>
        </div>

        {eurAmount !== null && (
          <div
            className="animate-rate-pop relative inline-flex items-center gap-1.5 rounded-full border border-ukraine-gold-200 bg-ukraine-gold-50 px-3 py-1.5 shadow-[0_2px_14px_rgba(245,184,0,0.22)]"
            title={t('rateSource')}
          >
            <span className="font-[family-name:var(--font-data)] text-[10px] font-bold uppercase tracking-[0.2em] text-ukraine-gold-700">
              ≈
            </span>
            <span className="font-[family-name:var(--font-data)] text-sm font-bold tracking-tight text-ukraine-gold-900">
              €{eurAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* ── Buy Button ── */}
      <div className="mt-5 flex justify-center">
        <stripe-buy-button
          buy-button-id={STRIPE_BUY_BUTTON_ID}
          publishable-key={STRIPE_PUBLISHABLE_KEY}
        />
      </div>
    </div>
  );
}
