import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { fontVariables } from '@/app/fonts';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import LoadingBar from '@/components/layout/LoadingBar';
import '../globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)] ambient-canvas">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LoadingBar />
          <Suspense>
            <Navigation />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
