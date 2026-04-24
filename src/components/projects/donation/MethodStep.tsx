'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface MethodStepProps {
  animationClass: string;
  projectTitle: string;
  monobankJarSendId?: string;
  onStripeSelect: () => void;
}

export default function MethodStep({
  animationClass,
  projectTitle,
  monobankJarSendId,
  onStripeSelect,
}: MethodStepProps) {
  const t = useTranslations('projectDetail');

  // monobank sendId：优先项目自己的，其次 fallback 到基金会主 jar
  const fallbackSendId = process.env.NEXT_PUBLIC_MONOBANK_FALLBACK_JAR_SEND_ID;
  const effectiveSendId = monobankJarSendId || fallbackSendId;
  const monobankUrl = effectiveSendId
    ? `https://send.monobank.ua/jar/${effectiveSendId}`
    : null;

  return (
    <div className={animationClass}>
      {/* ── 标题 ── */}
      <h3 className="text-lg font-semibold leading-tight text-ukraine-blue-900 sm:text-xl">
        {t('selectPaymentMethod')}
      </h3>

      {/* ── 项目徽章 ── */}
      <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-ukraine-blue-100 bg-ukraine-blue-50/60 px-3 py-1.5">
        <span className="truncate text-xs text-ukraine-blue-600">{projectTitle}</span>
      </div>

      {/* ── 支付方式列表 ── */}
      <div className="mt-5 space-y-2.5">
        {/* monobank */}
        {monobankUrl ? (
          <a
            href={monobankUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-ukraine-blue-100 bg-white p-4 transition-all duration-200 hover:border-ukraine-blue-900/50 hover:bg-ukraine-blue-50/40 hover:shadow-[0_4px_16px_rgba(0,108,178,0.1)]"
          >
            <div className="min-w-0 flex-1">
              <Image
                src="/logos/monobank.svg"
                alt="monobank"
                width={108}
                height={24}
                className="h-[22px] w-auto"
              />
              <div className="mt-1.5 text-xs leading-snug text-ukraine-blue-500">
                {t('monobankHint')}
              </div>
            </div>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-ukraine-blue-300 transition-all group-hover:translate-x-0.5 group-hover:text-ukraine-navy"
              strokeWidth={2.25}
            />
          </a>
        ) : (
          <div
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-3.5 rounded-xl border border-dashed border-ukraine-blue-100 bg-ukraine-blue-50/20 p-4 opacity-60"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Image
                  src="/logos/monobank.svg"
                  alt="monobank"
                  width={108}
                  height={24}
                  className="h-[22px] w-auto opacity-70"
                />
                <span className="rounded-full bg-ukraine-gold-50 px-1.5 py-0.5 font-[family-name:var(--font-data)] text-[9px] font-bold uppercase tracking-wide text-ukraine-gold-700">
                  {t('comingSoon')}
                </span>
              </div>
              <div className="mt-1.5 text-xs leading-snug text-ukraine-blue-400">
                {t('monobankUnavailable')}
              </div>
            </div>
          </div>
        )}

        {/* Stripe */}
        <button
          type="button"
          onClick={onStripeSelect}
          className="group relative flex w-full cursor-pointer items-center gap-3.5 overflow-hidden rounded-xl border border-ukraine-blue-100 bg-white p-4 text-left transition-all duration-200 hover:border-ukraine-blue-400 hover:bg-ukraine-blue-50/40 hover:shadow-[0_4px_16px_rgba(0,108,178,0.1)]"
        >
          <div className="min-w-0 flex-1">
            <Image
              src="/logos/stripe.svg"
              alt="Stripe"
              width={360}
              height={150}
              className="h-[22px] w-auto"
              priority={false}
            />
            <div className="mt-1.5 text-xs leading-snug text-ukraine-blue-500">
              {t('stripeHint')}
            </div>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-ukraine-blue-300 transition-all group-hover:translate-x-0.5 group-hover:text-ukraine-blue-500"
            strokeWidth={2.25}
          />
        </button>
      </div>
    </div>
  );
}
