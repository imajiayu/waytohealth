import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('donateTitle'),
    description: t('donateDescription'),
  };
}

export default async function DonatePage() {
  const t = await getTranslations('navigation');
  const tPages = await getTranslations('pages');

  return (
    <div className="container-page py-24">
      <h1 className="text-4xl font-[family-name:var(--font-display)] font-bold text-ukraine-blue-500">
        {t('donate')}
      </h1>
      <div className="accent-line" />
      <p className="mt-8 text-gray-400">{tPages('comingSoon')}</p>
    </div>
  );
}
