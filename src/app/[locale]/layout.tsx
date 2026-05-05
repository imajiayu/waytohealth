import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { fontVariables } from '@/app/fonts';
import { toLocale } from '@/i18n/config';
import { buildAlternates, buildOpenGraph, buildTwitter, siteUrl } from '@/lib/seo';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import LoadingBar from '@/components/layout/LoadingBar';
import { SOCIAL_LINKS, CONTACT } from '@/data/social';
import '../globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = toLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const title = t('title');
  const description = t('description');

  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
    manifest: '/manifest.json',
    alternates: buildAlternates(locale, '/'),
    openGraph: buildOpenGraph({ title, description, locale, path: '/' }),
    twitter: buildTwitter({ title, description }),
  };
}

// Organization / NonprofitOrganization JSON-LD —— 慈善机构常规结构化数据
// Google Knowledge Graph 实体识别的主要输入；字段越完整、与官方平台对得越上，
// 越能把 "way to health" 这一通用关键词在 SERP 中绑定到本基金会
function organizationJsonLd(locale: string) {
  const base = siteUrl();
  const name = locale === 'ua' ? 'Шлях до здоров\'я' : 'Way to Health';
  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    '@id': `${base}/#organization`,
    name,
    alternateName: [
      'Way to Health Ukraine',
      'Way to Health Charitable Foundation',
      'Шлях до здоров\'я',
      'Благодійний фонд «Шлях до здоров\'я»',
    ],
    legalName: 'Благодійний фонд «Шлях до здоров\'я»',
    url: base,
    logo: `${base}/images/logo-${locale === 'ua' ? 'ua' : 'en'}.webp`,
    image: `${base}/og-image.jpg`,
    description: locale === 'ua'
      ? 'Благодійний фонд «Шлях до здоров\'я» — реабілітаційний центр для постраждалих від війни в Україні.'
      : 'Way to Health is a Ukrainian charitable foundation running a rehabilitation center for those affected by the war.',
    email: CONTACT.email,
    telephone: CONTACT.phoneTel,
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: CONTACT.email,
      telephone: CONTACT.phoneTel,
      availableLanguage: ['uk', 'en'],
    }],
    address: locale === 'ua' ? {
      '@type': 'PostalAddress',
      streetAddress: 'вул. Теплична, 27С',
      addressLocality: 'смт Слобожанське',
      addressRegion: 'Дніпропетровська область',
      postalCode: '52005',
      addressCountry: 'UA',
    } : {
      '@type': 'PostalAddress',
      streetAddress: '27C Teplychna St.',
      addressLocality: 'Slobozhanske',
      addressRegion: 'Dnipropetrovsk Oblast',
      postalCode: '52005',
      addressCountry: 'UA',
    },
    areaServed: { '@type': 'Country', name: 'Ukraine' },
    knowsLanguage: ['uk', 'en'],
    foundingDate: '2022-09-24',
    taxID: '44947699',  // EDRPOU
    founder: [
      { '@type': 'Person', name: 'Mykyta Zhalin' },
      { '@type': 'Person', name: 'Oleksii Dubovyk' },
    ],
    sameAs: SOCIAL_LINKS.map((s) => s.href),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const jsonLd = organizationJsonLd(locale);
  const t = await getTranslations({ locale, namespace: 'a11y' });

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)] ambient-canvas">
        {/* 跳过导航 — 键盘用户可直接跳主内容 */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ukraine-blue-700 focus:shadow-lg focus:ring-2 focus:ring-ukraine-gold-500">
          {t('skipToContent')}
        </a>
        <script
          type="application/ld+json"
          // JSON.stringify 的输出只包含 JSON 安全字符，不会造成 XSS
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LoadingBar />
          <Suspense>
            <Navigation />
          </Suspense>
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
