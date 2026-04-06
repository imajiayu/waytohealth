import { getTranslations } from 'next-intl/server';
import { HeartHandshake, Sparkles } from 'lucide-react';

/**
 * 申请援助 — 占位 section
 *
 * 用于承接 PartnersStrip 的 "Request Assistance" CTA 锚点。
 * 当前只展示标题/说明 + Coming Soon 占位徽章；
 * 待表单/联系方式确定后再替换为真实交互。
 */
export default async function RequestAssistanceSection() {
  const t = await getTranslations('requestAssistance');

  return (
    <section
      id="request-assistance"
      className="relative scroll-mt-16 overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24"
    >
      {/* 装饰光晕 */}
      <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full opacity-[0.06] glow-brand-soft" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-60 w-60 rounded-full opacity-[0.05] glow-gold-soft" />

      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* 区域标签 */}
          <span className="inline-flex items-center gap-2 font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
            <HeartHandshake className="h-4 w-4" strokeWidth={2.25} />
            {t('label')}
          </span>

          {/* 标题 */}
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl md:text-5xl">
            {t('title')}
          </h2>

          {/* 装饰线 */}
          <div className="mx-auto mt-4 accent-line" />

          {/* 说明文案 */}
          <p className="mt-6 text-base leading-relaxed text-gray-600 sm:text-lg">
            {t('description')}
          </p>

          {/* Coming Soon 占位徽章 */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-ukraine-blue-200/70 bg-ukraine-blue-50/60 px-5 py-2.5 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-ukraine-blue-500" strokeWidth={2.25} />
            <span className="text-sm font-semibold text-ukraine-blue-700">
              {t('comingSoon')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
