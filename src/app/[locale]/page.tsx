import { useTranslations } from 'next-intl';
import PartnersShowcase from '@/components/partners/PartnersShowcase';
import HeroSection from '@/components/home/HeroSection';

export default function HomePage() {
  const tNav = useTranslations('navigation');

  return (
    <>
      {/* Hero — 全屏沉浸式首图 */}
      <HeroSection />

      {/* Проєкти */}
      <section id="projects" className="scroll-mt-16 py-20 bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-ukraine-blue-700">
            {tNav('projects')}
          </h2>
          <div className="mt-3 h-px bg-gradient-to-r from-ukraine-gold-400 to-transparent w-20" />
        </div>
      </section>

      {/* Про фонд */}
      <section id="about" className="scroll-mt-16 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-ukraine-blue-700">
            {tNav('about')}
          </h2>
          <div className="mt-3 h-px bg-gradient-to-r from-ukraine-gold-400 to-transparent w-20" />
        </div>
      </section>

      {/* Новини */}
      <section id="news" className="scroll-mt-16 py-20 bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-ukraine-blue-700">
            {tNav('news')}
          </h2>
          <div className="mt-3 h-px bg-gradient-to-r from-ukraine-gold-400 to-transparent w-20" />
        </div>
      </section>

      {/* Мерч */}
      <section id="merch" className="scroll-mt-16 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-ukraine-blue-700">
            {tNav('merch')}
          </h2>
          <div className="mt-3 h-px bg-gradient-to-r from-ukraine-gold-400 to-transparent w-20" />
        </div>
      </section>

      {/* Партнери */}
      <section id="partners" className="scroll-mt-16">
        <PartnersShowcase mode="scroll" className="bg-white" />
      </section>

      {/* Підтримати */}
      <section id="donate" className="scroll-mt-16 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-ukraine-blue-700">
            {tNav('donate')}
          </h2>
          <div className="mt-3 h-px bg-gradient-to-r from-ukraine-gold-400 to-transparent w-20" />
        </div>
      </section>
    </>
  );
}
