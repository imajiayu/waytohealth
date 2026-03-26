export const locales = ['ua', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ua';

export const localeNames: Record<Locale, string> = {
  ua: 'UA',
  en: 'EN',
};
