import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function HeroSection() {
  const t = useTranslations('hero');
  const tMeta = useTranslations('metadata');

  return (
    <section className="relative h-[calc(100svh-58px)] w-full overflow-hidden">
      {/* 背景图片 — priority 确保首屏立即加载 */}
      <Image
        src="/images/hero-rehabilitation.jpg"
        alt={t('imageAlt')}
        fill
        priority
        unoptimized
        sizes="100vw"
        className="object-cover object-[center_40%]"
      />

      {/* 底部渐变遮罩 — 从深蓝渐变，确保白色文字可读又不过度遮挡图片 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(3,36,63,0.82) 0%, rgba(3,36,63,0.45) 35%, rgba(3,36,63,0.08) 60%, transparent 100%)',
        }}
      />

      {/* 内容区 — 锚定在视口底部 */}
      <div className="absolute inset-0 flex flex-col justify-end pb-20 sm:pb-24 lg:pb-32">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* 金色装饰线 */}
          <div className="mb-5 h-[2px] w-12 bg-ukraine-gold-500 animate-hero-line sm:mb-6" />

          {/* 品牌标题 */}
          <h1 className="animate-hero-title font-[family-name:var(--font-display)] text-[2.5rem] leading-[1.05] font-light tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {tMeta('title')}
          </h1>

          {/* 使命副标题 */}
          <p className="mt-4 max-w-xl animate-hero-subtitle text-base font-light text-white/80 sm:mt-5 sm:text-lg md:text-xl lg:max-w-2xl lg:text-[1.35rem] lg:leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* 滚动提示线 */}
      <div className="absolute bottom-6 left-1/2 animate-hero-scroll">
        <div className="h-7 w-px bg-white/40" />
      </div>
    </section>
  );
}
