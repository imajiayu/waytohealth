import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('metadata');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-[family-name:var(--font-display)] font-bold text-ukraine-blue-500">
        {t('title')}
      </h1>
      <p className="mt-4 text-lg text-gray-600">{t('description')}</p>
    </div>
  );
}
