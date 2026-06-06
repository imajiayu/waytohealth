import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // 关掉 next-intl 中间件自动注入的 hreflang Link 头 —— 它用原始 locale 码（ua/en），
  // 其中 "ua" 不是合法 BCP-47 语言码（乌克兰语是 uk），被 Lighthouse 判 hreflang 无效。
  // hreflang 改由 metadata（src/lib/seo.ts 的 buildAlternates，输出 uk-UA / en）统一提供。
  alternateLinks: false,
});
