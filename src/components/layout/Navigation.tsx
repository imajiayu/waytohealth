'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { type Locale } from '@/i18n/config';
import Image from 'next/image';
import { triggerRouteChange } from './LoadingBar';

const menuItems = [
  { key: 'projects', path: '/projects' },
  { key: 'about', path: '/about' },
  { key: 'news', path: '/news' },
  { key: 'merch', path: '/merch' },
  { key: 'partners', path: '/partners' },
  // contacts 在所有页面都直接滚动到 footer
  { key: 'contacts', path: null as string | null },
];

export default function Navigation() {
  const t = useTranslations('navigation');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const isMenuOpenRef = useRef(false);
  const otherLocale = locale === 'ua' ? 'en' : 'ua';

  // 同步 ref 以供 scroll handler 读取（不能在渲染期间直接赋值）
  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  // 向下滚动超过 60px 时隐藏导航栏，向上滚动时显示；菜单打开时不隐藏
  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 60 && !isMenuOpenRef.current) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      lastScrollY.current = currentY;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 菜单打开时锁定页面滚动（仅 body，不动 html — 避免破坏 sticky 定位）
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isMenuOpen]);

  function handleLocaleSwitch() {
    triggerRouteChange();
    startTransition(() => {
      router.replace(pathname, { locale: otherLocale });
    });
  }

  function handleMenuItemClick(path: string | null) {
    setIsMenuOpen(false);
    if (!path) {
      // contacts：滚动到 footer
      setTimeout(() => {
        const el = document.getElementById('footer');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 350);
    } else {
      // 跳转到对应页面
      triggerRouteChange();
      router.push(path);
    }
  }

  return (
    <>
      {/* 顶部导航栏 */}
      <nav className={`sticky top-0 z-50 bg-white border-b border-gray-100
                       transition-transform duration-300 ease-out mt-[2px]
                       ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <button
              onClick={() => { if (pathname !== '/') { triggerRouteChange(); router.push('/'); } }}
              className="flex-shrink-0 cursor-pointer group"
              aria-label="Home"
            >
              <Image
                src="/images/logo.png"
                alt={locale === 'ua' ? 'Шлях до здоров\'я' : 'Way to Health'}
                width={1678}
                height={323}
                className="h-7 sm:h-9 w-auto transition-opacity group-hover:opacity-80"
                priority
              />
            </button>

            {/* 右侧控制按钮 */}
            <div className="flex items-center gap-1">
              {/* Donate 按钮 — 圆角矩形 */}
              <button
                onClick={() => handleMenuItemClick('/donate')}
                className="gradient-brand flex items-center rounded-xl
                           px-5 py-2 text-[13px] font-bold tracking-wide text-white
                           shadow-[0_2px_12px_rgba(0,108,178,0.35)]
                           transition-all duration-300
                           hover:shadow-[0_4px_20px_rgba(0,108,178,0.5)]
                           hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                {t('donate')}
              </button>

              <div className="w-px h-4 bg-gray-200 mx-1" />

              {/* 语言切换 */}
              <span className="relative px-2.5 py-1 text-[15px] tracking-wide font-medium">
                {locale === 'ua' ? (
                  <span className="text-ukraine-blue-600/40">UA</span>
                ) : (
                  <button
                    onClick={handleLocaleSwitch}
                    disabled={isPending}
                    className="text-ukraine-blue-600 hover:text-ukraine-blue-800
                               transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    UA
                  </button>
                )}
                <span className="mx-1 opacity-20">/</span>
                {locale === 'en' ? (
                  <span className="text-ukraine-blue-600/40">EN</span>
                ) : (
                  <button
                    onClick={handleLocaleSwitch}
                    disabled={isPending}
                    className="text-ukraine-blue-600 hover:text-ukraine-blue-800
                               transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    EN
                  </button>
                )}
              </span>

              <div className="w-px h-4 bg-gray-200 mx-1" />

              {/* 汉堡菜单按钮 */}
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="relative w-8 h-8 flex items-center justify-center
                           text-ukraine-blue-600 hover:text-ukraine-blue-800
                           transition-colors cursor-pointer"
                aria-label={t('menu')}
                aria-expanded={isMenuOpen}
              >
                <div className="w-[18px] h-[14px] relative">
                  <span
                    className={`absolute left-0 w-full h-[1.5px] bg-current rounded-full
                               transition-all duration-300 origin-center
                               ${isMenuOpen ? 'top-[6px] rotate-45' : 'top-0'}`}
                  />
                  <span
                    className={`absolute left-0 top-[6px] w-full h-[1.5px] bg-current rounded-full
                               transition-all duration-200
                               ${isMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'}`}
                  />
                  <span
                    className={`absolute left-0 w-full h-[1.5px] bg-current rounded-full
                               transition-all duration-300 origin-center
                               ${isMenuOpen ? 'top-[6px] -rotate-45' : 'top-[12px]'}`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 黑色蒙版 */}
      <div
        className={`fixed inset-0 z-40 bg-black/60
                   transition-opacity duration-300
                   ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* 右侧滑出面板 */}
      <div
        className={`fixed top-0 right-0 z-[100] h-full w-[min(380px,85vw)]
                   bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.08)]
                   transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]
                   flex flex-col overflow-hidden
                   ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('menu')}
      >
        {/* 渐变顶线 */}
        <div className="h-[2px] gradient-brand-line" />

        {/* 菜单项 */}
        <nav className="px-8 pt-6 flex-1">
          <ul>
            {menuItems.map((item, i) => {
              const isActive = item.path && pathname === item.path;
              return (
                <li key={item.key}>
                  {isActive ? (
                    <span
                      className={`block w-full text-left py-[14px] text-[20px]
                                 font-[family-name:var(--font-display)] font-medium tracking-wide
                                 text-ukraine-gold-500
                                 transition-[opacity,transform] duration-300
                                 border-b border-gray-100
                                 ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
                      style={{ transitionDelay: isMenuOpen ? `${80 + i * 50}ms` : '0ms' }}
                    >
                      {t(item.key)}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMenuItemClick(item.path)}
                      className={`w-full text-left py-[14px] text-[20px]
                                 font-[family-name:var(--font-display)] font-medium tracking-wide
                                 text-ukraine-blue-800 hover:text-ukraine-gold-500
                                 transition-[opacity,transform,color] duration-300 cursor-pointer
                                 border-b border-gray-100
                                 group
                                 ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
                      style={{ transitionDelay: isMenuOpen ? `${80 + i * 50}ms` : '0ms' }}
                    >
                      <span className="transition-transform duration-200 group-hover:translate-x-1">
                        {t(item.key)}
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部 Logo */}
        <div className="px-8 pb-8">
          <div className="h-px bg-gradient-to-r from-ukraine-blue-200 via-ukraine-gold-200 to-transparent" />
          <Image
            src="/images/logo.png"
            alt={locale === 'ua' ? 'Шлях до здоров\'я' : 'Way to Health'}
            width={1678}
            height={323}
            className="mt-4 h-6 w-auto"
          />
        </div>
      </div>
    </>
  );
}
