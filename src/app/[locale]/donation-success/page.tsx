import { getStripe } from '@/lib/stripe';
import { getProject } from '@/lib/data';
import { toLocale } from '@/i18n/config';
import { buildAlternates, buildOpenGraph, buildTwitter } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CircleCheck, ArrowLeft, Home } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = toLocale(rawLocale);
  const tMeta = await getTranslations({ locale, namespace: 'metadata' });
  const title = tMeta('donationSuccessTitle');
  const description = tMeta('donationSuccessDescription');
  return {
    title,
    description,
    alternates: buildAlternates(locale, '/donation-success'),
    openGraph: buildOpenGraph({ title, description, locale, path: '/donation-success' }),
    twitter: buildTwitter({ title, description }),
    // 感谢页不需要被索引
    robots: { index: false, follow: false },
  };
}

export default async function DonationSuccessPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const { session_id } = await searchParams;
  const typedLocale = toLocale(rawLocale);
  const t = await getTranslations({ locale: typedLocale, namespace: 'donationSuccess' });

  let amount: number | null = null;
  let projectName: string | null = null;
  let projectId: string | null = null;

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      if (session.payment_status === 'paid' && session.amount_total) {
        amount = session.amount_total / 100; // копійки → UAH
      }
      projectId = session.metadata?.project_id ?? null;
      if (projectId) {
        const project = await getProject(Number(projectId));
        projectName = project.title[typedLocale];
      }
    } catch {
      // session 获取失败，显示通用感谢信息
    }
  }

  const hasDetails = amount !== null;

  return (
    <div className="relative min-h-[60vh] overflow-clip">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute -top-20 right-[-10%] h-[36rem] w-[36rem] rounded-full aura-cyan-xl opacity-30" />
      <div className="pointer-events-none absolute left-[-15%] bottom-0 h-[28rem] w-[28rem] rounded-full aura-gold-lg opacity-20" />

      <div className="container-page section-y relative flex flex-col items-center">
        {/* 成功图标 */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-life-50">
          <CircleCheck className="h-10 w-10 text-life-500" strokeWidth={1.5} />
        </div>

        {/* 标题 */}
        <h1 className="mt-6 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
          {hasDetails ? t('title') : t('genericTitle')}
        </h1>
        <p className="mt-3 text-center text-lg text-ukraine-blue-600">
          {hasDetails ? t('subtitle') : t('genericSubtitle')}
        </p>

        {/* 捐赠详情卡片 */}
        {hasDetails && (
          <div className="mt-8 w-full max-w-sm overflow-hidden rounded-2xl border border-ukraine-blue-100/60 bg-white/90 shadow-[0_4px_24px_rgba(0,108,178,0.08)] backdrop-blur-sm">
            <div className="h-1 gradient-brand-line" />
            <div className="divide-y divide-ukraine-blue-100/60 p-5">
              <div className="flex items-center justify-between pb-4">
                <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-blue-400">
                  {t('amount')}
                </span>
                <span className="font-[family-name:var(--font-data)] text-xl font-bold text-ukraine-blue-900">
                  ₴{amount!.toLocaleString('uk-UA')}
                </span>
              </div>
              {projectName && (
                <div className="flex items-center justify-between pt-4">
                  <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-blue-400">
                    {t('project')}
                  </span>
                  <span className="text-right text-sm font-medium text-ukraine-blue-700">
                    {projectName}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作链接 */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          {projectId && (
            <Link
              href={`/projects?id=${projectId}`}
              className="flex items-center gap-2 rounded-xl border border-ukraine-blue-200 px-5 py-2.5 text-sm font-medium text-ukraine-blue-700 transition-colors hover:bg-ukraine-blue-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToProject')}
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-ukraine-blue-200 px-5 py-2.5 text-sm font-medium text-ukraine-blue-700 transition-colors hover:bg-ukraine-blue-50"
          >
            <Home className="h-4 w-4" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
