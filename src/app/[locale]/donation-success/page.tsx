import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Heart } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toLocale } from '@/i18n/config';
import DonateTracker from '@/components/analytics/DonateTracker';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

export default async function DonationSuccessPage({ params }: Props) {
  setRequestLocale(toLocale((await params).locale));
  const t = await getTranslations('donationSuccess');

  return (
    <div className="container-page py-16 sm:py-24">
      {/* Meta Pixel Donate（付款完成回跳时触发一次） */}
      <DonateTracker />
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-life-50 text-life-500">
          <Heart className="h-8 w-8" strokeWidth={2} />
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ukraine-blue-900 sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-ukraine-blue-800/85 sm:text-base">
          {t('body')}
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="gradient-brand inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold tracking-wide text-white shadow-brand-cta transition hover:opacity-90"
          >
            {t('back')}
          </Link>
        </div>
      </div>
    </div>
  );
}
