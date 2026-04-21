import { type Locale, locales } from '@/i18n/config';

// hreflang 标签 — Google 更接受 IETF 标签（uk-UA / en）而不是纯 ua/en
const HREFLANG_TAG: Record<Locale, string> = {
  ua: 'uk-UA',
  en: 'en',
};

export const OG_LOCALE: Record<Locale, string> = {
  ua: 'uk_UA',
  en: 'en_US',
};

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://waytohealth.org.ua';
}

/**
 * 生成 canonical + hreflang alternates。
 * @param currentLocale 当前页面 locale
 * @param pathWithoutLocale  URL 不含 locale 前缀的部分（/about, /projects?id=3, /news 等）
 */
export function buildAlternates(currentLocale: Locale, pathWithoutLocale: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const base = siteUrl();
  const normalizedPath = pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`;
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[HREFLANG_TAG[loc]] = `${base}/${loc}${normalizedPath === '/' ? '' : normalizedPath}`;
  }
  // 默认 x-default 指向乌克兰语（主语言）
  languages['x-default'] = `${base}/ua${normalizedPath === '/' ? '' : normalizedPath}`;
  return {
    canonical: `${base}/${currentLocale}${normalizedPath === '/' ? '' : normalizedPath}`,
    languages,
  };
}

export interface BasicOgInput {
  title: string;
  description: string;
  locale: Locale;
  path: string;   // 不含 locale
  image?: string; // 绝对 URL 或相对路径
}

export function buildOpenGraph({ title, description, locale, path, image = '/og-image.jpg' }: BasicOgInput) {
  const base = siteUrl();
  const url = `${base}/${locale}${path === '/' ? '' : path}`;
  return {
    type: 'website' as const,
    url,
    siteName: 'Way to Health',
    locale: OG_LOCALE[locale],
    title,
    description,
    images: [image.startsWith('http') ? image : `${base}${image.startsWith('/') ? image : `/${image}`}`],
  };
}

export function buildTwitter({ title, description, image = '/og-image.jpg' }: Pick<BasicOgInput, 'title' | 'description' | 'image'>) {
  const base = siteUrl();
  return {
    card: 'summary_large_image' as const,
    title,
    description,
    images: [image.startsWith('http') ? image : `${base}${image.startsWith('/') ? image : `/${image}`}`],
  };
}
