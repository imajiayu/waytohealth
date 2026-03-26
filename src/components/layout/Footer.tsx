'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { type Locale } from '@/i18n/config';
import Image from 'next/image';
import { Globe, Phone, ArrowUpRight } from 'lucide-react';

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

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
  { name: 'Facebook', href: 'https://facebook.com/waytohealth.ua', icon: FacebookIcon },
  { name: 'Instagram', href: 'https://instagram.com/waytohealth.ua', icon: InstagramIcon },
  { name: 'Telegram', href: 'https://t.me/waytohealth_ua', icon: TelegramIcon },
  { name: 'YouTube', href: 'https://youtube.com/@waytohealthua', icon: YoutubeIcon },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/waytohealth-ua', icon: LinkedinIcon },
];

const NAV_COL_1 = ['about', 'team', 'partners', 'faq'] as const;
const NAV_COL_2 = ['programs', 'news', 'reports', 'media'] as const;

/* ── Component ───────────────────────────────────────────────── */

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;
  const router = useRouter();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0d1b2e] text-gray-300">
      {/* Gradient accent line */}
      <div className="h-[2px] bg-gradient-to-r from-[#006CB2] via-[#00A7BD] to-[#77C3CD]" />

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Top row: Logo + Language + Social */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-12">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-shrink-0 cursor-pointer group"
              aria-label="Home"
            >
              <Image
                src={locale === 'ua' ? '/images/logo-ua.svg' : '/images/logo-en.svg'}
                alt="Way to Health"
                width={160}
                height={48}
                className="h-12 w-auto brightness-0 invert opacity-90 transition-opacity group-hover:opacity-100"
              />
            </button>
          </div>

          {/* Language indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Globe className="w-4 h-4" />
            <span>{t('language')}</span>
          </div>

          {/* Social icons + Foundation page */}
          <div className="flex items-center gap-6">
            <span className="hidden lg:block text-sm text-gray-400 whitespace-nowrap">
              {t('foundationPage')}
            </span>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center
                             text-gray-400 hover:bg-white/15 hover:text-white
                             transition-all duration-200"
                >
                  <Icon className="w-[18px] h-[18px]" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Middle row: Nav + Contact + CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          {/* Nav Column 1 */}
          <nav className="space-y-3">
            {NAV_COL_1.map((key) => (
              <Link
                key={key}
                href={`/${key}`}
                className="block text-[15px] text-gray-300 hover:text-white transition-colors duration-150"
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          {/* Nav Column 2 */}
          <nav className="space-y-3">
            {NAV_COL_2.map((key) => (
              <Link
                key={key}
                href={`/${key}`}
                className="block text-[15px] text-gray-300 hover:text-white transition-colors duration-150"
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          {/* Contact info */}
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('generalQuestions')}</p>
              <a
                href="mailto:info@waytohealth.org.ua"
                className="text-[15px] text-gray-300 hover:text-white transition-colors
                           inline-flex items-center gap-1 group"
              >
                info@waytohealth.org.ua
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-y-0.5 translate-x-0.5
                                         group-hover:opacity-70 group-hover:translate-y-0 group-hover:translate-x-0
                                         transition-all duration-200" />
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('collaboration')}</p>
              <a
                href="mailto:partners@waytohealth.org.ua"
                className="text-[15px] text-gray-300 hover:text-white transition-colors
                           inline-flex items-center gap-1 group"
              >
                partners@waytohealth.org.ua
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-y-0.5 translate-x-0.5
                                         group-hover:opacity-70 group-hover:translate-y-0 group-hover:translate-x-0
                                         transition-all duration-200" />
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('volunteers')}</p>
              <Link
                href="/volunteer"
                className="text-[15px] text-gray-300 hover:text-white transition-colors
                           inline-flex items-center gap-1 group"
              >
                {t('volunteerForm')}
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-y-0.5 translate-x-0.5
                                         group-hover:opacity-70 group-hover:translate-y-0 group-hover:translate-x-0
                                         transition-all duration-200" />
              </Link>
            </div>
          </div>

          {/* Hotline + Donate */}
          <div className="space-y-4">
            {/* Hotline card */}
            <a
              href="tel:+380441234567"
              className="flex items-center justify-between gap-3
                         bg-white/6 rounded-xl px-5 py-3.5
                         hover:bg-white/10 transition-colors duration-200 group"
            >
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{t('hotline')}</p>
                <p className="text-[15px] text-white font-medium tracking-wide font-[family-name:var(--font-data)]">
                  +38 044 123 4567
                </p>
              </div>
              <Phone className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </a>

            {/* Donate CTA */}
            <button
              onClick={() => router.push('/donate')}
              className="w-full flex items-center justify-between gap-3
                         bg-ukraine-gold-500 text-ukraine-blue-900 rounded-xl px-5 py-3.5
                         hover:bg-ukraine-gold-400 active:scale-[0.98]
                         transition-all duration-200 cursor-pointer font-semibold group"
            >
              <span className="text-[15px]">{t('donate')}</span>
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>

            {/* Legal entity info */}
            <p className="text-xs text-gray-600 leading-relaxed mt-4">
              {t('legalEntity')}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            {t('copyright', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}
