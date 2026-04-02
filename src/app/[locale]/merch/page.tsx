import { useTranslations } from 'next-intl';

export default function MerchPage() {
  const t = useTranslations('navigation');
  const tPages = useTranslations('pages');

  return (
    <div className="container-page py-24">
      <h1 className="text-4xl font-[family-name:var(--font-display)] font-bold text-ukraine-blue-500">
        {t('merch')}
      </h1>
      <div className="accent-line" />
      <p className="mt-8 text-gray-400">{tPages('comingSoon')}</p>
    </div>
  );
}
