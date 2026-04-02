import { getTranslations } from 'next-intl/server';
import HeroSection from '@/components/home/HeroSection';
import ProjectsSection from '@/components/home/ProjectsSection';

export default async function HomePage() {
  const tNav = await getTranslations('navigation');

  return (
    <>
      {/* Hero — 全屏沉浸式首图（含 Partners 滚动条） */}
      <HeroSection />

      {/* Проєкти */}
      <ProjectsSection />

      {/* Про фонд */}
      <section id="about" className="scroll-mt-16 py-20">
        <div className="container-page">
          <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-ukraine-blue-700">
            {tNav('about')}
          </h2>
          <div className="accent-line" />
        </div>
      </section>

      {/* Новини */}
      <section id="news" className="scroll-mt-16 py-20">
        <div className="container-page">
          <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-ukraine-blue-700">
            {tNav('news')}
          </h2>
          <div className="accent-line" />
        </div>
      </section>

      {/* Мерч */}
      <section id="merch" className="scroll-mt-16 py-20">
        <div className="container-page">
          <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-ukraine-blue-700">
            {tNav('merch')}
          </h2>
          <div className="accent-line" />
        </div>
      </section>

      {/* Підтримати */}
      <section id="donate" className="scroll-mt-16 py-20">
        <div className="container-page">
          <h2 className="text-3xl font-[family-name:var(--font-display)] font-semibold text-ukraine-blue-700">
            {tNav('donate')}
          </h2>
          <div className="accent-line" />
        </div>
      </section>
    </>
  );
}
