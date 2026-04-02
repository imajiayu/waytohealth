import { useTranslations } from 'next-intl';
import PartnersStrip from '@/components/partners/PartnersStrip';

export default function HeroSection() {
  const t = useTranslations('hero');

  return (
    <section className="relative w-full px-4 pt-2 sm:px-6 lg:px-8">
      {/* 圆角渐变背景块 — 填满首屏（减去导航栏 h-14 + 外边距） */}
      <div
        className="gradient-brand-full relative flex flex-col overflow-hidden rounded-3xl"
        style={{ minHeight: 'calc(100vh - 56px - 8px - 16px)' }}
      >
        {/* 装饰性光晕 */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00A7BD, transparent)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #006CB2, transparent)' }}
        />

        {/* 内容区 — flex-1 撑满剩余空间，居中显示 */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-6">
          {/* 品牌名称 */}
          <div className="animate-hero-title flex flex-col items-center">
            <span className="text-sm font-semibold tracking-[0.35em] text-white/70 uppercase sm:text-base md:text-lg">
              {t('foundationLabel')}
            </span>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-none font-bold tracking-tight text-white sm:mt-4 sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
              WAY TO HEALTH
            </h1>
          </div>

          {/* 副标题 */}
          <p className="animate-hero-cta mt-6 max-w-2xl text-center text-lg font-light text-white/80 sm:mt-8 sm:text-xl md:text-2xl">
            {t('subtitle')}
          </p>
        </div>

        {/* Partners 滚动条 — 色块底部，mt-auto 贴底 */}
        <div id="partners" className="relative mt-auto scroll-mt-16">
          <div className="mx-6 border-t border-white/20" />
          <PartnersStrip />
        </div>
      </div>
    </section>
  );
}
