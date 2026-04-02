'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { Phone, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

/* ── Brand SVG Icons (not available in Lucide) ──────────────── */

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.092.063 1.541.126V8.16c-.167-.018-.457-.027-.824-.027-1.17 0-1.623.442-1.623 1.594v2.319h3.178l-.546 3.667h-2.632v8.23a11.955 11.955 0 0 0 3.558-1.202A12 12 0 0 0 24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.628 3.874 10.35 9.101 11.691Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}


function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ── Constants ───────────────────────────────────────────────── */

const SOCIAL_LINKS = [
  { name: 'Facebook', href: 'https://www.facebook.com/Waytohealthfoundation', icon: FacebookIcon },
  { name: 'Instagram', href: 'https://www.instagram.com/way__to_health/', icon: InstagramIcon },
  { name: 'TikTok', href: 'https://www.tiktok.com/@way_to_health', icon: TikTokIcon },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/way-to-health-ua/', icon: LinkedinIcon },
];

const NAV_COL_1 = ['about', 'team', 'partners', 'faq'] as const;
const NAV_COL_2 = ['programs', 'news', 'reports', 'media'] as const;

/* ── Component ───────────────────────────────────────────────── */

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const router = useRouter();

  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="bg-[#0d1b2e] text-gray-300">
      {/* 渐变分隔线 */}
      <div className="h-[2px] gradient-brand-line" />

      <div className="container-page pt-14 sm:pt-16 pb-10">
        {/* ── 顶部：Logo + 社交 ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-14">
          <button
            onClick={() => router.push('/')}
            className="flex-shrink-0 cursor-pointer group"
            aria-label="Home"
          >
            <Image
              src={`/images/logo-${locale === 'ua' ? 'ua' : 'en'}.svg`}
              alt="Way to Health"
              width={300}
              height={80}
              className="h-20 w-auto opacity-90 transition-opacity group-hover:opacity-100"
            />
          </button>

          <div className="flex items-center gap-5">
            <span className="hidden lg:block text-base text-gray-400 whitespace-nowrap">
              {t('foundationPage')}
            </span>
            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="w-11 h-11 rounded-full bg-white/8 flex items-center justify-center
                             text-gray-400 hover:bg-white/15 hover:text-white
                             transition-all duration-200"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── 主体：导航 + 联系方式 + CTA ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-10">
          {/* 导航栏：移动端两列并排 */}
          <div className="grid grid-cols-2 gap-6 lg:contents">
            <nav className="space-y-4">
              {NAV_COL_1.map((key) => (
                <Link
                  key={key}
                  href={`/${key}`}
                  className="block text-lg text-gray-300 hover:text-white transition-colors duration-150"
                >
                  {t(key)}
                </Link>
              ))}
            </nav>

            <nav className="space-y-4">
              {NAV_COL_2.map((key) => (
                <Link
                  key={key}
                  href={`/${key}`}
                  className="block text-lg text-gray-300 hover:text-white transition-colors duration-150"
                >
                  {t(key)}
                </Link>
              ))}
            </nav>
          </div>

          {/* 联系方式 */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-1.5">{t('generalQuestions')}</p>
              <a
                href="mailto:info@waytohealth.org.ua"
                className="text-base text-gray-200 hover:text-white transition-colors
                           inline-flex items-center gap-1.5 group"
              >
                info@waytohealth.org.ua
                <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-0.5 translate-x-0.5
                                         group-hover:opacity-70 group-hover:translate-y-0 group-hover:translate-x-0
                                         transition-all duration-200" />
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1.5">{t('collaboration')}</p>
              <a
                href="mailto:partners@waytohealth.org.ua"
                className="text-base text-gray-200 hover:text-white transition-colors
                           inline-flex items-center gap-1.5 group"
              >
                partners@waytohealth.org.ua
                <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-0.5 translate-x-0.5
                                         group-hover:opacity-70 group-hover:translate-y-0 group-hover:translate-x-0
                                         transition-all duration-200" />
              </a>
            </div>
          </div>

          {/* 热线 + 捐赠 */}
          <div className="space-y-4">
            {/* 热线卡片 */}
            <a
              href="tel:+380441234567"
              className="flex items-center justify-between gap-4
                         bg-white/6 rounded-xl px-5 py-4
                         hover:bg-white/10 transition-colors duration-200 group"
            >
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('hotline')}</p>
                <p className="text-lg text-white font-medium tracking-wide font-[family-name:var(--font-data)]">
                  +38 044 123 4567
                </p>
              </div>
              <Phone className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors flex-shrink-0" />
            </a>

            {/* 捐赠按钮 */}
            <button
              onClick={() => router.push('/donate')}
              className="w-full flex items-center justify-between gap-3
                         bg-ukraine-gold-500 text-ukraine-blue-900 rounded-xl px-5 py-4
                         hover:bg-ukraine-gold-400 active:scale-[0.98]
                         transition-all duration-200 cursor-pointer font-semibold group"
            >
              <span className="text-base">{t('donate')}</span>
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>

            {/* 法人信息 */}
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              {t('legalEntity')}
            </p>
          </div>
        </div>
      </div>

      {/* ── 底部版权 ── */}
      <div className="border-t border-white/8">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {t('copyright', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}
