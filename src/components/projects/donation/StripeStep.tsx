'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Script from 'next/script';
import { STRIPE_BUY_BUTTON_ID, STRIPE_PUBLISHABLE_KEY } from './utils';

interface StripeStepProps {
  animationClass: string;
  projectTitle: string;
  onBack: () => void;
}

export default function StripeStep({
  animationClass,
  projectTitle,
  onBack,
}: StripeStepProps) {
  const t = useTranslations('projectDetail');

  return (
    <div className={animationClass}>
      {/* Stripe buy-button Web Component 脚本 */}
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
          02 / 02
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

      {/* ── 项目徽章 ── */}
      <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-ukraine-blue-100 bg-ukraine-blue-50/60 px-3 py-1.5">
        <span className="truncate text-xs text-ukraine-blue-600">{projectTitle}</span>
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
