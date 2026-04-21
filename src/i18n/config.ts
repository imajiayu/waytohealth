export const locales = ['ua', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ua';

export const localeNames: Record<Locale, string> = {
  ua: 'UA',
  en: 'EN',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}
