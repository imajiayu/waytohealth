import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import localFont from 'next/font/local';
import { PT_Serif, JetBrains_Mono } from 'next/font/google';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import LoadingBar from '@/components/layout/LoadingBar';
import '../globals.css';

// 主字体: Fixel Text — 由 MacPaw + AlfaBravo 设计的乌克兰开源字体
// 自托管在 public/fonts/fixel/，源自 https://github.com/MacPaw/Fixel
// 注入到 --font-body,标题通过 globals.css 的 --font-display 别名复用同一字体
const fixelText = localFont({
  src: [
    { path: '../../../public/fonts/fixel/FixelText-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../../public/fonts/fixel/FixelText-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../../public/fonts/fixel/FixelText-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../../public/fonts/fixel/FixelText-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../../public/fonts/fixel/FixelText-ExtraBold.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
});

// 辅助衬线字体: PT Serif — 替代品牌规范中的 Sitka Text (后者为微软付费字体)
// 仅用于装饰性标题点缀,不用于大段正文
const ptSerif = PT_Serif({
  variable: '--font-accent',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-data',
  subsets: ['latin', 'cyrillic'],
});

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
    <html lang={locale} className={`${fixelText.variable} ${ptSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)]">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LoadingBar />
          <Navigation />
          <main className="ambient-canvas flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
