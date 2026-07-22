'use client';

import Image from 'next/image';
import { Mail, Phone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import FocusTrap from 'focus-trap-react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { triggerRouteChange } from './LoadingBar';
import ContactLink from '@/components/analytics/ContactLink';
import { SOCIAL_LINKS, CONTACT } from '@/data/social';

interface MenuItem {
  key: string;
  path: string | null;
  scrollTo?: string;
}

// 抽屉里的导航项；contacts 是滚动到 footer 而非独立页面
const MENU_ITEMS: MenuItem[] = [
  { key: 'projects', path: '/projects' },
  { key: 'about', path: '/about' },
  { key: 'news', path: '/news' },
  { key: 'merch', path: '/merch' },
  { key: 'contacts', path: null, scrollTo: 'footer' },
];

interface MobileMenuPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenuPanel({ open, onClose }: MobileMenuPanelProps) {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEscapeKey(open, onClose);

  function handleItemClick(item: MenuItem) {
    onClose();

    if (item.scrollTo) {
      const scrollToEl = () => {
        const el = document.getElementById(item.scrollTo!);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      };

      if (item.path && pathname !== item.path) {
        triggerRouteChange();
        router.push(item.path);
        setTimeout(scrollToEl, 600);
      } else {
        setTimeout(scrollToEl, 350);
      }
    } else if (item.path) {
      triggerRouteChange();
      router.push(item.path);
    }
  }

  return (
    <>
      {/* 黑色蒙版 */}
      <div
        className={`fixed inset-0 z-40 bg-black/60
                   transition-opacity duration-300
                   ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 右侧滑出面板 — 面板常驻 DOM 用 translate-x 切换；FocusTrap 仅在 open 时激活 */}
      <FocusTrap
        active={open}
        focusTrapOptions={{
          escapeDeactivates: false, // ESC 交给 useEscapeKey 处理，避免双回调
          allowOutsideClick: true,  // 点击蒙版时允许外部 click 穿透到 onClose
          clickOutsideDeactivates: false,
        }}
      >
      <div
        className={`fixed top-0 right-0 z-[100] h-full w-[min(340px,78vw)] sm:w-[min(380px,85vw)]
                   bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.08)]
                   transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]
                   flex flex-col overflow-hidden
                   ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('menu')}
      >
        {/* 渐变顶线 */}
        <div className="h-[2px] gradient-brand-line" />

        {/* 菜单项 */}
        <nav className="px-6 sm:px-8 pt-4 sm:pt-6 flex-1">
          <ul>
            {MENU_ITEMS.map((item, i) => {
              // scrollTo 项不显示 active；projects 用前缀匹配
              const isActive = item.path && !item.scrollTo &&
                (pathname === item.path || (pathname.startsWith('/projects') && item.key === 'projects'));
              return (
                <li key={item.key}>
                  {isActive ? (
                    <span
                      className={`block w-full text-left py-2.5 sm:py-[14px] text-[16px] sm:text-[20px]
                                 font-[family-name:var(--font-display)] font-medium tracking-wide
                                 text-ukraine-gold-500
                                 transition-[opacity,transform] duration-300
                                 border-b border-gray-100
                                 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
                      style={{ transitionDelay: open ? `${80 + i * 50}ms` : '0ms' }}
                    >
                      {t(item.key)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left py-2.5 sm:py-[14px] text-[16px] sm:text-[20px]
                                 font-[family-name:var(--font-display)] font-medium tracking-wide
                                 text-ukraine-blue-800 hover:text-ukraine-gold-500
                                 transition-[opacity,transform,color] duration-300 cursor-pointer
                                 border-b border-gray-100
                                 group
                                 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
                      style={{ transitionDelay: open ? `${80 + i * 50}ms` : '0ms' }}
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

        {/* 底部：品牌签名区 */}
        <div className="mt-auto">
          <div className="bg-gradient-to-t from-ukraine-blue-50/50 to-transparent px-6 sm:px-8 pt-4 sm:pt-5 pb-5 sm:pb-8">
            {/* 联系信息 */}
            <div
              className={`space-y-2 sm:space-y-2.5 mb-4 sm:mb-5 transition-[opacity,transform] duration-300
                         ${open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
              style={{ transitionDelay: open ? `${80 + MENU_ITEMS.length * 50 + 30}ms` : '0ms' }}
            >
              <ContactLink
                href={`mailto:${CONTACT.email}`}
                channel="email"
                className="flex items-center gap-2.5 sm:gap-3 text-[12px] sm:text-[13px] text-ukraine-blue-700/70 hover:text-ukraine-blue-600 transition-colors group"
              >
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-ukraine-blue-100/60 flex-shrink-0 flex items-center justify-center
                                 group-hover:bg-ukraine-blue-100 transition-colors">
                  <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-ukraine-blue-400" />
                </span>
                <span className="truncate">{CONTACT.email}</span>
              </ContactLink>
              <ContactLink
                href={`tel:${CONTACT.phoneTel}`}
                channel="phone"
                className="flex items-center gap-2.5 sm:gap-3 text-[12px] sm:text-[13px] text-ukraine-blue-700/70 hover:text-ukraine-blue-600 transition-colors group"
              >
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-ukraine-blue-100/60 flex-shrink-0 flex items-center justify-center
                                 group-hover:bg-ukraine-blue-100 transition-colors">
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-ukraine-blue-400" />
                </span>
                <span className="font-[family-name:var(--font-data)] tracking-wide">{CONTACT.phoneDisplay}</span>
              </ContactLink>
            </div>

            {/* 社交媒体 */}
            <div
              className={`flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-6 transition-[opacity,transform] duration-300
                         ${open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
              style={{ transitionDelay: open ? `${80 + MENU_ITEMS.length * 50 + 80}ms` : '0ms' }}
            >
              {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-ukraine-blue-200/60 flex items-center justify-center
                             text-ukraine-blue-400 hover:bg-ukraine-blue-500 hover:text-white
                             hover:border-ukraine-blue-500 hover:shadow-[0_2px_8px_rgba(0,108,178,0.25)]
                             transition-all duration-200"
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              ))}
            </div>

            {/* 金色菱形分隔 */}
            <div
              className={`flex items-center gap-2 mb-3 sm:mb-4 transition-[opacity,transform] duration-300
                         ${open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
              style={{ transitionDelay: open ? `${80 + MENU_ITEMS.length * 50 + 120}ms` : '0ms' }}
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ukraine-blue-200/80 to-ukraine-blue-300/50" />
              <div className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-ukraine-gold-400/80" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-ukraine-blue-200/80 to-ukraine-blue-300/50" />
            </div>

            {/* Logo 签名 */}
            <div
              className={`transition-[opacity,transform] duration-300
                         ${open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
              style={{ transitionDelay: open ? `${80 + MENU_ITEMS.length * 50 + 160}ms` : '0ms' }}
            >
              <Image
                src={locale === 'ua' ? '/images/logo-ua.webp' : '/images/logo-en.webp'}
                alt={locale === 'ua' ? 'Шлях до здоров\'я' : 'Way to Health'}
                width={locale === 'ua' ? 826 : 539}
                height={locale === 'ua' ? 165 : 104}
                className="h-5 sm:h-6 w-auto opacity-70"
              />
            </div>
          </div>
        </div>
      </div>
      </FocusTrap>
    </>
  );
}
