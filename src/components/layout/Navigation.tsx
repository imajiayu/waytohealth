'use client';

import { useState, useTransition, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { type Locale } from '@/i18n/config';
import Image from 'next/image';

export default function Navigation() {
  const t = useTranslations('navigation');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const otherLocale = locale === 'ua' ? 'en' : 'ua';

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleLocaleSwitch() {
    startTransition(() => {
      router.replace(pathname, { locale: otherLocale });
    });
  }

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
        hasScrolled ? 'shadow-[0_1px_12px_rgba(7,108,179,0.08)]' : ''
      }`}
    >
      {/* Gradient accent line */}
      <div className="h-[2px] bg-gradient-to-r from-[#006CB2] via-[#00A7BD] to-[#77C3CD]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex-shrink-0 cursor-pointer group"
            aria-label="Home"
          >
            <Image
              src="/images/logo.svg"
              alt="Way to Health"
              width={140}
              height={42}
              className="h-7 sm:h-8 w-auto transition-opacity group-hover:opacity-80"
              priority
            />
          </button>

          {/* Right side controls */}
          <div className="flex items-center gap-1">
            {/* Language toggle */}
            <button
              onClick={handleLocaleSwitch}
              disabled={isPending}
              className="relative px-2.5 py-1 text-[13px] tracking-wide font-medium
                         text-ukraine-blue-600 hover:text-ukraine-blue-800
                         transition-colors disabled:opacity-40 cursor-pointer"
            >
              <span className="opacity-40">{locale === 'ua' ? 'UA' : 'EN'}</span>
              <span className="mx-1 opacity-20">/</span>
              <span>{locale === 'ua' ? 'EN' : 'UA'}</span>
            </button>

            <div className="w-px h-4 bg-gray-200 mx-1" />

            {/* Donate button */}
            <button
              onClick={() => router.push('/donate')}
              className="text-center px-4 py-1.5 text-[13px] font-semibold tracking-wide text-white
                         bg-ukraine-gold-500 rounded-full
                         hover:bg-ukraine-gold-600 active:scale-[0.97]
                         transition-all duration-150 cursor-pointer"
            >
              {/* Invisible longest text to lock width */}
              <span className="block h-0 overflow-hidden invisible" aria-hidden="true">Підтримати</span>
              {t('donate')}
            </button>

            <div className="w-px h-4 bg-gray-200 mx-1" />

            {/* Hamburger menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative w-8 h-8 flex items-center justify-center
                         text-ukraine-blue-600 hover:text-ukraine-blue-800
                         transition-colors cursor-pointer"
              aria-label={t('menu')}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-[18px] h-[14px] relative">
                <span
                  className={`absolute left-0 w-full h-[1.5px] bg-current rounded-full
                             transition-all duration-300 origin-center
                             ${isMobileMenuOpen ? 'top-[6px] rotate-45' : 'top-0'}`}
                />
                <span
                  className={`absolute left-0 top-[6px] w-full h-[1.5px] bg-current rounded-full
                             transition-all duration-200
                             ${isMobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'}`}
                />
                <span
                  className={`absolute left-0 w-full h-[1.5px] bg-current rounded-full
                             transition-all duration-300 origin-center
                             ${isMobileMenuOpen ? 'top-[6px] -rotate-45' : 'top-[12px]'}`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Menu panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out
                    ${isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-1">
            <p className="text-sm text-gray-400 text-center py-4">Menu items coming soon</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
