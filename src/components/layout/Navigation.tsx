'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { type Locale } from '@/i18n/config';
import Image from 'next/image';
import { triggerRouteChange } from './LoadingBar';

const menuItems = [
  { key: 'projects', path: '/projects?id=12' },
  { key: 'about', path: '/about' },
  { key: 'news', path: '/news' },
  { key: 'merch', path: '/merch' },
  // contacts 在所有页面都直接滚动到 footer
  { key: 'contacts', path: null as string | null, scrollTo: 'footer' },
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

  function handleMenuItemClick(item: typeof menuItems[number]) {
    setIsMenuOpen(false);

    if (item.scrollTo) {
      const scrollToEl = () => {
        const el = document.getElementById(item.scrollTo!);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      };

      // 如果需要先跳转页面（如 projects 需要先回首页）
      if (item.path && pathname !== item.path) {
        triggerRouteChange();
        router.push(item.path);
        // 等页面加载后再滚动
        setTimeout(scrollToEl, 600);
      } else {
        // 已在目标页面，等菜单关闭动画后直接滚动
        setTimeout(scrollToEl, 350);
      }
    } else if (item.path) {
      triggerRouteChange();
      router.push(item.path);
    }
  }

  return (
    <>
      {/* 顶部导航栏 */}
      <nav className={`sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100/80
                       transition-transform duration-300 ease-out mt-[2px]
                       ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="container-page">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link
              href="/"
              onClick={() => { if (pathname !== '/') triggerRouteChange(); }}
              className="flex-shrink-0 group"
            >
              <Image
                src={locale === 'ua' ? '/images/logo-ua.png' : '/images/logo-en.png'}
                alt={locale === 'ua' ? 'Шлях до здоров\'я' : 'Way to Health'}
                width={locale === 'ua' ? 826 : 539}
                height={locale === 'ua' ? 165 : 104}
                className="h-7 sm:h-9 w-auto transition-opacity group-hover:opacity-80"
                priority
              />
            </Link>

            {/* 右侧控制按钮 */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Donate 按钮 */}
              <button
                onClick={() => handleMenuItemClick({ key: 'donate', path: '/projects?id=12' })}
                className="gradient-brand flex items-center rounded-xl
                           px-3.5 sm:px-5 py-1.5 sm:py-2 text-[12px] sm:text-[13px]
                           font-bold tracking-wide text-white
                           shadow-[0_2px_12px_rgba(0,108,178,0.35)]
                           transition-all duration-300
                           hover:shadow-[0_4px_20px_rgba(0,108,178,0.5)]
                           hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                {t('donate')}
              </button>

              {/* 语言切换胶囊 */}
              <div className="inline-flex items-center rounded-full bg-gray-100 p-[2px]">
                <button
                  onClick={locale !== 'ua' ? handleLocaleSwitch : undefined}
                  disabled={isPending || locale === 'ua'}
                  className={`rounded-full px-2 sm:px-2.5 py-[3px] text-[11px] sm:text-[12px]
                             font-semibold tracking-wide transition-all duration-300 cursor-pointer
                             ${locale === 'ua'
                               ? 'bg-white text-ukraine-blue-700 shadow-sm'
                               : 'text-gray-400 hover:text-ukraine-blue-600'}`}
                >
                  UA
                </button>
                <button
                  onClick={locale !== 'en' ? handleLocaleSwitch : undefined}
                  disabled={isPending || locale === 'en'}
                  className={`rounded-full px-2 sm:px-2.5 py-[3px] text-[11px] sm:text-[12px]
                             font-semibold tracking-wide transition-all duration-300 cursor-pointer
                             ${locale === 'en'
                               ? 'bg-white text-ukraine-blue-700 shadow-sm'
                               : 'text-gray-400 hover:text-ukraine-blue-600'}`}
                >
                  EN
                </button>
              </div>

              {/* 汉堡菜单按钮 */}
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="relative w-9 h-9 flex items-center justify-center
                           text-ukraine-blue-600 hover:text-ukraine-blue-800
                           transition-colors cursor-pointer rounded-lg
                           hover:bg-ukraine-blue-50 active:bg-ukraine-blue-100"
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
              // scrollTo 类型的菜单项不显示 active 状态（它们是滚动锚点，不是独立页面）
              // projects 用前缀匹配，在任意 /projects/* 页面都高亮
              const isActive = item.path && !item.scrollTo &&
                (pathname === item.path || (pathname.startsWith('/projects') && item.key === 'projects'));
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
                      onClick={() => handleMenuItemClick(item)}
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
            src={locale === 'ua' ? '/images/logo-ua.png' : '/images/logo-en.png'}
            alt={locale === 'ua' ? 'Шлях до здоров\'я' : 'Way to Health'}
            width={locale === 'ua' ? 826 : 539}
            height={locale === 'ua' ? 165 : 104}
            className="mt-4 h-6 w-auto"
          />
        </div>
      </div>
    </>
  );
}
