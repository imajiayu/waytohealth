import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { toLocale } from '@/i18n/config';
import { buildAlternates, buildOpenGraph, buildTwitter } from '@/lib/seo';
import PartnershipForm from '@/components/forms/PartnershipForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'forms.partnership.meta' });
  const title = t('title');
  const description = t('description');
  return {
    title,
    description,
    alternates: buildAlternates(locale, '/partnership'),
    openGraph: buildOpenGraph({ title, description, locale, path: '/partnership' }),
    twitter: buildTwitter({ title, description }),
    robots: { index: false, follow: true },
  };
}

export default async function PartnershipPage({ params }: Props) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('forms.partnership');

  return (
    <div className="container-page py-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.6fr)] lg:gap-14 xl:gap-20">
        {/* 左栏：标题 + 简介（桌面端 sticky） */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] tracking-tight text-ukraine-blue-900 sm:text-[2.25rem]">
            {t('title')}
          </h1>
          <div className="accent-line mt-4" />
          <p className="mt-5 text-[14.5px] leading-relaxed text-ukraine-blue-800/85">
            {t('intro')}
          </p>
        </aside>

        {/* 右栏：表单卡片 */}
        <section className="rounded-2xl border border-ukraine-blue-100/70 bg-white/70 p-6 shadow-[0_1px_0_rgba(0,108,178,0.04),0_12px_32px_-18px_rgba(0,36,58,0.18)] backdrop-blur-sm sm:p-8">
          <PartnershipForm locale={locale} />
        </section>
      </div>
    </div>
  );
}
