import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function RequestAssistanceSuccessPage() {
  const t = await getTranslations('forms.requestAssistance.success');

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-life-50 text-life-500">
          <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
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
