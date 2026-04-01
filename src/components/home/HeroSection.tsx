import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function HeroSection() {
  const t = useTranslations('hero');
  const tMeta = useTranslations('metadata');

  const stats = [
    { value: t('stats.patients'), label: t('stats.patientsLabel') },
    { value: t('stats.years'), label: t('stats.yearsLabel') },
    { value: t('stats.rate'), label: t('stats.rateLabel') },
    { value: t('stats.partners'), label: t('stats.partnersLabel') },
  ];

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
            'linear-gradient(to top, rgba(3,36,63,0.85) 0%, rgba(3,36,63,0.55) 35%, rgba(3,36,63,0.08) 60%, transparent 100%)',
        }}
      />

      {/* 内容区 — 锚定在视口底部 */}
      <div className="absolute inset-0 flex flex-col justify-end pb-20 sm:pb-24 lg:pb-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* 底部左右分栏布局 */}
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
            {/* 左侧：标题 + 副标题 + CTA */}
            <div className="max-w-2xl">
              {/* 金色装饰线 */}
              <div className="mb-5 h-[3px] w-14 bg-ukraine-gold-500 animate-hero-line sm:mb-6 sm:w-16" />

              {/* 品牌标题 */}
              <h1
                className="animate-hero-title font-[family-name:var(--font-display)] text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
                style={{ textShadow: '0 2px 12px rgba(3,36,63,0.5), 0 1px 3px rgba(0,0,0,0.3)' }}
              >
                {tMeta('title')}
              </h1>

              {/* 使命副标题 */}
              <p className="mt-4 max-w-xl animate-hero-subtitle text-base font-light text-white/80 sm:mt-5 sm:text-lg md:text-xl lg:text-[1.35rem] lg:leading-relaxed">
                {t('subtitle')}
              </p>

              {/* CTA 按钮组 */}
              <div className="mt-7 flex animate-hero-cta flex-wrap gap-4 sm:mt-8">
                {/* 主按钮：捐赠 — 金黄色背景 + 深蓝文字 */}
                <button
                  type="button"
                  className="rounded-lg bg-ukraine-gold-500 px-7 py-3 text-sm font-semibold tracking-wide text-ukraine-blue-900 shadow-md transition-all duration-200 hover:bg-ukraine-gold-600 hover:shadow-lg sm:px-8 sm:py-3.5 sm:text-base"
                >
                  {t('donateButton')}
                </button>

                {/* 次按钮：了解更多 — 白色描边 */}
                <button
                  type="button"
                  className="rounded-lg border-2 border-white/60 px-7 py-3 text-sm font-semibold tracking-wide text-white shadow-sm transition-all duration-200 hover:border-white hover:bg-white/10 sm:px-8 sm:py-3.5 sm:text-base"
                >
                  {t('learnMoreButton')}
                </button>
              </div>
            </div>

            {/* 右侧：影响力数据 */}
            <div className="animate-hero-stats grid grid-cols-4 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-right">
                  <div className="font-[family-name:var(--font-data)] text-2xl font-bold text-ukraine-gold-400 sm:text-3xl lg:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs font-medium tracking-wide text-white/60 uppercase sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 滚动提示线 */}
      <div className="absolute bottom-6 left-1/2 animate-hero-scroll">
        <div className="h-7 w-px bg-white/40" />
      </div>
    </section>
  );
}
