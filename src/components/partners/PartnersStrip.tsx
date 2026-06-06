'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowRight, Handshake, HeartHandshake } from 'lucide-react';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { partners } from '@/data/partners';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

/* ── 自动+手动滚动的 Partners 条（嵌入渐变色块内） ──────────── */

export default function PartnersStrip() {
  const t = useTranslations('partners');
  const scrollRef = useAutoScroll<HTMLDivElement>();

  return (
    <div className="px-4 py-5 sm:px-8 sm:py-8 md:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6 md:gap-8">
        {/* CTA 按钮组 — 移动端和桌面端都竖排堆叠（避免乌克兰语长词在横排时溢出） */}
        <div className="flex flex-col gap-2.5 sm:flex-shrink-0 sm:justify-center sm:gap-3">
          {/* 主 CTA: Request Assistance — 白底实心，跳转站内表单页 */}
          <Link
            href="/request-assistance"
            className="group inline-flex items-center justify-between gap-3
                       rounded-full bg-white px-5 py-3
                       text-[0.8rem] font-bold tracking-[0.12em] text-ukraine-blue-600 uppercase
                       shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)]
                       ring-1 ring-inset ring-white/60
                       transition-all duration-300
                       hover:bg-ukraine-blue-600 hover:text-white hover:ring-white/30
                       hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45)]
                       sm:px-7 sm:py-3.5 sm:text-sm"
          >
            <span className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.25} />
              {t('requestAssistance')}
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 transition-transform duration-300
                         group-hover:translate-x-1 sm:h-[18px] sm:w-[18px]"
            />
          </Link>

          {/* 次 CTA: Become a Partner — 玻璃感 outline，跳转站内表单页 */}
          <Link
            href="/partnership"
            className="group inline-flex items-center justify-between gap-3
                       rounded-full bg-white/10 px-5 py-3 backdrop-blur-sm
                       text-[0.8rem] font-semibold tracking-[0.12em] text-white/85 uppercase
                       ring-1 ring-inset ring-white/25
                       transition-all duration-300
                       hover:bg-white/20 hover:text-white hover:ring-white/45
                       sm:px-7 sm:py-3.5 sm:text-sm"
          >
            <span className="flex items-center gap-2">
              <Handshake className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.25} />
              {t('becomePartner')}
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 transition-transform duration-300
                         group-hover:translate-x-1 sm:h-[18px] sm:w-[18px]"
            />
          </Link>
        </div>

        {/* 垂直分隔线 — 仅桌面端可见 */}
        <div
          aria-hidden
          className="hidden sm:block w-px self-stretch
                     bg-gradient-to-b from-transparent via-white/25 to-transparent"
        />

        {/* Logo 滚动区 — 填充剩余宽度 */}
        <div className="relative min-w-0 flex-1">
          <div
            ref={scrollRef}
            className="flex h-full items-center gap-1 overflow-x-auto hide-scrollbar"
          >
            {partners.map((partner, idx) => {
              const name = t(`list.${partner.id}.name`);
              // 首屏可见 logo 是 LCP 候选（hero 无大图，最大可见图就是这条 logo 带）。
              // 默认 next/image loading="lazy" 会让 LCP 元素延迟加载（PageSpeed 标
              // "应该应用 fetchpriority=high"），用 priority 改为 eager + fetchpriority=high。
              // 桌面宽屏首屏内可见约 6~7 个 logo（移动端仅 2~3 个），阈值取 8 覆盖桌面
              // fold —— Lighthouse desktop 实测 LCP logo 落在第 4 个之后仍被 lazy。logo 体积
              // 极小（数 KB），多 eager 几个对带宽无压力。
              const isAboveFold = idx < 8;
              const logoImg = (
                <Image
                  src={partner.logo}
                  alt={name}
                  width={180}
                  height={72}
                  priority={isAboveFold}
                  className="h-full w-auto object-contain"
                />
              );
              // 固定容器高度（vataga 是纵向 logo，单独放大）—— 避免图片真实 aspect ratio
              // 加载完后撑开行高度引起 CLS（PageSpeed 实测移动端 CLS 0.277 主要源于此）
              const heightClass =
                partner.id === 'vataga'
                  ? 'h-20 sm:h-28 md:h-32'
                  : 'h-14 sm:h-20 md:h-24';
              const itemClass = cn(
                'flex flex-shrink-0 items-center justify-center px-2.5 py-3 opacity-80 transition-opacity duration-300 hover:opacity-100 sm:px-4 sm:py-4 md:px-5',
                heightClass,
              );
              // 无 url 的合作伙伴渲染为非可点击元素，避免 target=_blank 打开重复 tab
              return partner.url ? (
                <a
                  key={partner.id}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={itemClass}
                >
                  {logoImg}
                </a>
              ) : (
                <div key={partner.id} className={itemClass}>
                  {logoImg}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
