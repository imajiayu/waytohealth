import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { toLocale } from '@/i18n/config';
import { buildAlternates, buildOpenGraph, buildTwitter } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const title = t('merchTitle');
  const description = t('merchDescription');
  return {
    title,
    description,
    alternates: buildAlternates(locale, '/merch'),
    openGraph: buildOpenGraph({ title, description, locale, path: '/merch' }),
    twitter: buildTwitter({ title, description }),
  };
}

// TODO: 当前为 Coming Soon 占位页，后续接入周边商品列表 + Stripe Product
export default async function MerchPage({ params }: Props) {
  setRequestLocale(toLocale((await params).locale));
  const t = await getTranslations('navigation');
  const tPages = await getTranslations('pages');

  return (
    <div className="container-page section-y">
      <h1 className="text-4xl font-[family-name:var(--font-display)] font-bold text-ukraine-blue-500">
        {t('merch')}
      </h1>
      <div className="accent-line" />
      <p className="mt-8 text-gray-400">{tPages('comingSoon')}</p>
    </div>
  );
}
