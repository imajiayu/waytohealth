import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import CopyIbanButton from './CopyIbanButton';
import ContactLink from '@/components/analytics/ContactLink';
import { SOCIAL_LINKS, CONTACT } from '@/data/social';

/* ── Constants ───────────────────────────────────────────────── */

const LEGAL_LINKS = [
  { key: 'terms', href: '/terms' },
  { key: 'publicAgreements', href: '/public-agreements' },
  { key: 'privacy', href: '/privacy' },
] as const;

const IBAN = 'UA363052990000026007050555233';
const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Slobozhanske village Heroiv Ukrainy 27C Ukraine');

/* ── Component ───────────────────────────────────────────────── */

export default async function Footer() {
  const [t, locale] = await Promise.all([
    getTranslations('footer'),
    getLocale(),
  ]);

  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="px-3 pb-3 sm:px-6 sm:pb-4 lg:px-8">
      {/* 圆角深色卡片 — 与 HeroSection 的圆角矩形风格一致 */}
      <div className="relative overflow-hidden rounded-2xl bg-ukraine-navy text-white sm:rounded-3xl">
        {/* 装饰性光晕 */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-15 blur-3xl glow-teal" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-10 blur-3xl glow-blue" />

        {/* 顶部渐变装饰线 */}
        <div className="h-[2px] gradient-brand-line" />

        <div className="relative container-page pt-6 sm:pt-16 pb-3 sm:pb-10">
          {/* ── 顶部：Logo + 社交 ── */}
          <div className="flex items-center justify-between gap-4 mb-5 sm:mb-12 sm:gap-6">
            <Link
              href="/"
              className="flex-shrink-0 group"
              aria-label="Home"
            >
              <Image
                src={`/images/logo-${locale === 'ua' ? 'ua' : 'en'}.svg`}
                alt="Way to Health"
                width={300}
                height={80}
                className="h-10 w-auto opacity-90 transition-opacity group-hover:opacity-100 sm:h-20"
              />
            </Link>

            <div className="flex items-center gap-5">
              <span className="hidden lg:block text-base text-white/70 whitespace-nowrap">
                {t('foundationPage')}
              </span>
              <div className="flex items-center gap-2 sm:gap-2.5">
                {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center
                               text-white/70 hover:bg-white/20 hover:text-white
                               transition-all duration-200
                               sm:w-11 sm:h-11"
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── 主体：移动端用 order 重排（contents 打散左右两列），桌面端恢复左右两列 ── */}
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Left group — mobile 下 contents 让子元素直接参与外层 flex，desktop 恢复 flex-col */}
            <div className="contents lg:flex lg:flex-col lg:gap-6">
              {/* 联系方式卡片组 — 三块独立小卡，移动端用紧凑间距 + active 点击反馈 */}
              <div className="order-1 space-y-1.5 sm:space-y-3 lg:order-none">
                {/* 邮箱卡片 */}
                <ContactLink
                  href={`mailto:${CONTACT.email}`}
                  channel="email"
                  className="group flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06]
                             px-3 py-2.5 active:bg-white/[0.09] transition-all duration-200
                             sm:gap-5 sm:rounded-2xl sm:border-white/[0.08]
                             sm:px-6 sm:py-5 sm:hover:bg-white/[0.07] sm:hover:border-white/[0.14]"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg gradient-brand flex items-center justify-center
                                  shadow-lg shadow-ukraine-blue-500/20 group-hover:shadow-ukraine-blue-500/30 transition-shadow
                                  sm:w-12 sm:h-12 sm:rounded-xl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-white sm:w-5 sm:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium tracking-widest text-white/40 uppercase leading-none mb-1 sm:text-xs sm:mb-1">{t('email')}</p>
                    <p className="text-sm text-white truncate group-hover:text-white/90 transition-colors sm:text-lg">
                      {CONTACT.email}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0
                                           group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                </ContactLink>

                {/* 电话卡片 */}
                <ContactLink
                  href={`tel:${CONTACT.phoneTel}`}
                  channel="phone"
                  className="group flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06]
                             px-3 py-2.5 active:bg-white/[0.09] transition-all duration-200
                             sm:gap-5 sm:rounded-2xl sm:border-white/[0.08]
                             sm:px-6 sm:py-5 sm:hover:bg-white/[0.07] sm:hover:border-white/[0.14]"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg gradient-brand flex items-center justify-center
                                  shadow-lg shadow-ukraine-blue-500/20 group-hover:shadow-ukraine-blue-500/30 transition-shadow
                                  sm:w-12 sm:h-12 sm:rounded-xl">
                    <Phone className="w-4 h-4 text-white sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium tracking-widest text-white/40 uppercase leading-none mb-1 sm:text-xs sm:mb-1">{t('hotline')}</p>
                    <p className="text-sm text-white font-[family-name:var(--font-data)] tracking-wide group-hover:text-white/90 transition-colors sm:text-lg">
                      {CONTACT.phoneDisplay}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0
                                           group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                </ContactLink>

                {/* 地址卡片 — 点击跳转 Google Maps */}
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06]
                             px-3 py-2.5 active:bg-white/[0.09] transition-all duration-200
                             sm:gap-5 sm:rounded-2xl sm:border-white/[0.08]
                             sm:px-6 sm:py-5 sm:hover:bg-white/[0.07] sm:hover:border-white/[0.14]"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg gradient-brand flex items-center justify-center
                                  shadow-lg shadow-ukraine-blue-500/20 group-hover:shadow-ukraine-blue-500/30 transition-shadow
                                  sm:w-12 sm:h-12 sm:rounded-xl">
                    <MapPin className="w-4 h-4 text-white sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium tracking-widest text-white/40 uppercase leading-none mb-1 sm:text-xs sm:mb-1">{t('addressLabel')}</p>
                    <p className="text-sm text-white leading-snug group-hover:text-white/90 transition-colors sm:text-lg">
                      {t('address')}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 flex-shrink-0
                                           group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                </a>
              </div>

              {/* 法律文档链接 — 带竖线分隔的精致样式 */}
              <nav className="order-4 flex flex-wrap items-center -mx-2 sm:mx-0 sm:gap-1 sm:pt-2 lg:order-none">
                {LEGAL_LINKS.map(({ key, href }, i) => (
                  <span key={key} className="flex items-center">
                    <Link
                      href={href}
                      className="text-xs text-white/45 px-2 py-1 hover:text-white/80 transition-colors sm:text-sm sm:px-3 sm:py-1.5"
                    >
                      {t(key)}
                    </Link>
                    {i < LEGAL_LINKS.length - 1 && (
                      <span className="text-white/15 select-none">·</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            {/* Right group — 同样用 contents 打散，desktop 恢复 block+space-y */}
            <div className="contents lg:block lg:space-y-4">
              {/* 银行信息卡片 */}
              <div className="order-3 bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 space-y-3 sm:rounded-2xl sm:p-7 sm:space-y-5 lg:order-none">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase sm:text-sm">
                    {t('bankDetails')}
                  </p>
                  <span className="text-[11px] text-white/50 truncate sm:text-sm">
                    JSC CB &quot;PRIVATBANK&quot;
                  </span>
                </div>

                {/* IBAN */}
                <div>
                  <p className="text-[11px] text-white/50 mb-1.5 sm:text-xs sm:mb-2">IBAN</p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <p className="text-xs text-white font-medium tracking-wider font-[family-name:var(--font-data)] break-all leading-snug sm:text-lg sm:leading-relaxed">
                      {IBAN}
                    </p>
                    <CopyIbanButton iban={IBAN} ariaLabel={t('copyIban')} />
                  </div>
                </div>

                {/* 受款方代码 */}
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 sm:pt-4">
                  <p className="text-xs text-white/50 sm:text-sm">{t('recipientCode')}</p>
                  <p className="text-sm text-white font-medium tracking-wide font-[family-name:var(--font-data)] sm:text-base">
                    44719925
                  </p>
                </div>
              </div>

              {/* 捐赠按钮 — 使用品牌渐变，与导航栏 / 项目卡片 Donate 按钮统一 */}
              <Link
                href="/projects"
                className="group gradient-brand order-2 flex w-full items-center justify-between gap-3
                           rounded-xl px-5 py-3 font-semibold text-white
                           shadow-[0_2px_12px_rgba(0,108,178,0.35)]
                           transition-all duration-300
                           hover:shadow-[0_6px_24px_rgba(0,108,178,0.55)]
                           hover:brightness-[1.08] active:scale-[0.98]
                           sm:px-6 sm:py-4
                           lg:order-none"
              >
                <span className="text-base sm:text-lg">{t('donate')}</span>
                <ArrowUpRight className="w-5 h-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>

              {/* 法人信息 — mobile 用负上边距靠近法律链接 */}
              <p className="order-5 -mt-2 text-xs text-white/40 leading-relaxed sm:text-sm lg:order-none lg:mt-0">
                {t('legalEntity')}
              </p>
            </div>
          </div>
        </div>

        {/* ── 底部版权 ── */}
        <div className="relative border-t border-white/[0.06]">
          <div className="container-page py-2 flex flex-col sm:flex-row items-center justify-between gap-3 sm:py-5">
            <p className="text-xs text-white/40 sm:text-sm">
              {t('copyright', { year: currentYear })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
