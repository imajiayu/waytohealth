'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import Image from 'next/image';
import Script from 'next/script';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useState } from 'react';

interface DonationSidebarProps {
  goalAmount: number | null;
  raisedAmount: number;
  projectTitle: string;
  monobankJarSendId?: string;
  eurRate: number | null;
}

// 预设金额选项（UAH）
const AMOUNT_OPTIONS = [100, 500, 1000, 5000];

// Stripe buy button — publishable key 是公开值，可以直接放在前端 bundle
const STRIPE_BUY_BUTTON_ID = 'buy_btn_1TMbgmG9LnRczdGMXXd5jvOV';
const STRIPE_PUBLISHABLE_KEY =
  'pk_live_51MuwqQG9LnRczdGMOiaXL3lFvyGgzcTZuyhnqWFTUKg51EJ2SwIro9A79zSjGVi2hq0mFx5eiN9FFC5NdFNVwrri00OVgHW6xp';

function formatCurrency(amount: number) {
  return `₴${amount.toLocaleString('uk-UA')}`;
}

type View = 'amount' | 'method' | 'stripe';
type Direction = 'forward' | 'backward';

export default function DonationSidebar({
  goalAmount,
  raisedAmount,
  projectTitle,
  monobankJarSendId,
  eurRate,
}: DonationSidebarProps) {
  const t = useTranslations('projectDetail');
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [view, setView] = useState<View>('amount');
  const [direction, setDirection] = useState<Direction>('forward');
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
    const cleaned = value.replace(/[^\d]/g, '');
    setCustomAmount(cleaned);
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const handleDonate = () => {
    if (currentAmount <= 0) return;
    setError('');
    setDirection('forward');
    setView('method');
  };

  const handleBack = () => {
    setDirection('backward');
    setError('');
    // 从 stripe 回到 method；从 method 回到 amount
    setView((v) => (v === 'stripe' ? 'method' : 'amount'));
  };

  const handleStripeSelect = () => {
    if (currentAmount <= 0) return;
    setError('');
    setDirection('forward');
    setView('stripe');
  };

  const animationClass =
    direction === 'forward' ? 'animate-panel-forward' : 'animate-panel-backward';

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-ukraine-blue-100/60 bg-white/90 shadow-[0_4px_24px_rgba(0,108,178,0.08)] backdrop-blur-sm"
    >
      {/* 顶部渐变装饰线 */}
      <div className="h-1 gradient-brand-line" />

      <div className="p-5 sm:p-6">
        {view === 'amount' ? (
          <div key="amount" className={animationClass}>
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

            {/* ── Donate 按钮 ── */}
            <button
              onClick={handleDonate}
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
        ) : view === 'method' ? (
          <MethodView
            key="method"
            animationClass={animationClass}
            amount={Math.floor(currentAmount)}
            projectTitle={projectTitle}
            monobankJarSendId={monobankJarSendId}
            onBack={handleBack}
            onStripeSelect={handleStripeSelect}
            error={error}
          />
        ) : (
          <StripeView
            key="stripe"
            animationClass={animationClass}
            amount={Math.floor(currentAmount)}
            projectTitle={projectTitle}
            eurRate={eurRate}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 支付方式选择视图（panel 内的第二步）
// ─────────────────────────────────────────────────────────────────────

interface MethodViewProps {
  animationClass: string;
  amount: number;
  projectTitle: string;
  monobankJarSendId?: string;
  onBack: () => void;
  onStripeSelect: () => void;
  error: string;
}

function MethodView({
  animationClass,
  amount,
  projectTitle,
  monobankJarSendId,
  onBack,
  onStripeSelect,
  error,
}: MethodViewProps) {
  const t = useTranslations('projectDetail');

  // monobank sendId：优先用项目自己配置的，其次 fallback 到基金会主 jar
  const fallbackSendId = process.env.NEXT_PUBLIC_MONOBANK_FALLBACK_JAR_SEND_ID;
  const effectiveSendId = monobankJarSendId || fallbackSendId;
  const monobankUrl = effectiveSendId
    ? `https://send.monobank.ua/jar/${effectiveSendId}`
    : null;

  return (
    <div className={animationClass}>
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
          02 / 03
        </span>
      </div>

      {/* ── 标题 ── */}
      <h3 className="mt-4 text-lg font-semibold leading-tight text-ukraine-blue-900 sm:text-xl">
        {t('selectPaymentMethod')}
      </h3>

      {/* ── 金额徽章 ── */}
      <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-ukraine-blue-100 bg-ukraine-blue-50/60 px-3 py-1.5">
        <span className="font-[family-name:var(--font-data)] text-sm font-bold text-ukraine-blue-700">
          {formatCurrency(amount)}
        </span>
        <span className="h-1 w-1 shrink-0 rounded-full bg-ukraine-blue-300" />
        <span className="truncate text-xs text-ukraine-blue-600">{projectTitle}</span>
      </div>

      {/* ── 错误提示 ── */}
      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}

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

// ─────────────────────────────────────────────────────────────────────
// Stripe 支付视图（panel 内的第三步）— 嵌入官方 Buy Button
// ─────────────────────────────────────────────────────────────────────

interface StripeViewProps {
  animationClass: string;
  amount: number;
  projectTitle: string;
  eurRate: number | null;
  onBack: () => void;
}

function StripeView({
  animationClass,
  amount,
  projectTitle,
  eurRate,
  onBack,
}: StripeViewProps) {
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
