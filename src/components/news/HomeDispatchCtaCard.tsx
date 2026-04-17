import { ArrowUpRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function HomeDispatchCtaCard() {
  const t = await getTranslations('news');

  return (
    <Link
      href="/news"
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] bg-ukraine-navy px-6 py-7 text-white transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(13,27,46,0.5)]"
    >
      {/* 装饰光源 */}
      <div
        aria-hidden
        className="glow-teal pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full opacity-25 blur-3xl"
      />
      <div
        aria-hidden
        className="glow-gold pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-18 blur-3xl"
      />

      {/* SVG noise 颗粒感 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* 中部:大号 viewAll 标题 */}
      <div className="relative">
        <div className="font-[family-name:var(--font-accent)] text-[2rem] font-bold leading-[1.05] tracking-[-0.02em] text-white sm:text-[2.2rem]">
          {t('viewAll')}
        </div>
        <div aria-hidden className="mt-4 h-px w-10 bg-ukraine-gold-500" />
      </div>

      {/* 底部:箭头按钮 */}
      <div className="relative flex items-end justify-end">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ukraine-gold-500/80 text-ukraine-gold-400 transition-all duration-300 group-hover:rotate-[-8deg] group-hover:scale-105 group-hover:border-ukraine-gold-500 group-hover:bg-ukraine-gold-500 group-hover:text-ukraine-navy">
          <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}
