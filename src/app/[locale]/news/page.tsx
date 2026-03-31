import { useTranslations } from 'next-intl';

export default function NewsPage() {
  const t = useTranslations('navigation');
  const tPages = useTranslations('pages');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <h1 className="text-4xl font-[family-name:var(--font-display)] font-bold text-ukraine-blue-500">
        {t('news')}
      </h1>
      <div className="mt-3 h-px bg-gradient-to-r from-ukraine-gold-400 to-transparent w-20" />
      <p className="mt-8 text-gray-400">{tPages('comingSoon')}</p>
    </div>
  );
}
