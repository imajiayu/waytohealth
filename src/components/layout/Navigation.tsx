'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { toLocale } from '@/i18n/config';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import Image from 'next/image';
import { triggerRouteChange } from './LoadingBar';
import LocaleSwitcher from './LocaleSwitcher';

// 移动菜单面板离屏常驻（靠 translate-x 切换），不进 SSR 内容也不影响首屏渲染。
// 用 dynamic(ssr:false) 把它和它依赖的 focus-trap-react 移出初始 bundle，改为
// hydration 后异步加载 —— 桌面端从不打开菜单，移动端首次点击前也无需这段 JS。
const MobileMenuPanel = dynamic(() => import('./MobileMenuPanel'), { ssr: false });

export default function Navigation() {
  const t = useTranslations('navigation');
  const locale = toLocale(useLocale());
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const isMenuOpenRef = useRef(false);

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

  // 菜单打开时锁定页面滚动（走共享 hook，避免与 lightbox/bottom-sheet 双重锁互相覆盖）
  useBodyScrollLock(isMenuOpen);

  function handleDonateClick() {
    triggerRouteChange();
    router.push('/projects');
  }

  return (
    <>
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
                src={locale === 'ua' ? '/images/logo-ua.webp' : '/images/logo-en.webp'}
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
                type="button"
                onClick={handleDonateClick}
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

              <LocaleSwitcher />

              {/* 汉堡菜单按钮 */}
              <button
                type="button"
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

      <MobileMenuPanel open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
