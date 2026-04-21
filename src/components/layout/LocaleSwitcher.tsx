'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/navigation';
import { type Locale } from '@/i18n/config';
import { triggerRouteChange } from './LoadingBar';

// UA / EN 双向切换胶囊，保留当前 path + query。
export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const otherLocale: Locale = locale === 'ua' ? 'en' : 'ua';

  function switchLocale() {
    triggerRouteChange();
    const search = searchParams.toString();
    const href = search ? `${pathname}?${search}` : pathname;
    startTransition(() => {
      router.replace(href, { locale: otherLocale });
    });
  }

  return (
    <div className="inline-flex items-center rounded-full bg-gray-100 p-[2px]">
      <button
        onClick={locale !== 'ua' ? switchLocale : undefined}
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
        onClick={locale !== 'en' ? switchLocale : undefined}
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
  );
}
