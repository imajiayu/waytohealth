import { getProject, getProjectCover, getAllProjects } from '@/lib/data';
import { getRaisedAmount } from '@/lib/donations';
import { type Locale } from '@/i18n/config';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Check } from 'lucide-react';
import DonationSidebar from '@/components/projects/DonationSidebar';
import MobileDonationSheet from '@/components/projects/MobileDonationSheet';
import DocumentViewer from '@/components/projects/DocumentViewer';
import PatientStories from '@/components/projects/PatientStories';
import ProjectStrip from '@/components/projects/ProjectStrip';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const { id } = await searchParams;
  const typedLocale: Locale = (locale as Locale) ?? 'ua';

  if (!id) return { title: 'Projects' };

  try {
    const project = await getProject(Number(id));
    return {
      title: project.title[typedLocale],
      description: project.description[typedLocale],
    };
  } catch {
    return { title: 'Project Not Found' };
  }
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { id } = await searchParams;
  const typedLocale: Locale = (locale as Locale) ?? 'ua';

  if (!id) notFound();

  let project;
  try {
    project = await getProject(Number(id));
  } catch {
    notFound();
  }

  const allProjects = await getAllProjects();
  const stripProjects = allProjects.map((p) => ({
    id: p.id,
    data: {
      title: p.title,
      description: p.description,
      goal_amount: p.goal_amount,
      raised_amount: p.raised_amount,
      currency: p.currency,
      tags: p.tags,
    },
    cover: p.cover,
  }));

  const cover = getProjectCover(Number(id));
  const title = project.title[typedLocale];
  const detail = project.detail;

  // 从 Stripe 获取实时已筹金额
  const raisedAmount = await getRaisedAmount(Number(id));

  // 捐赠栏的 props — 复用于桌面和移动端
  const sidebarProps = {
    goalAmount: project.goal_amount,
    raisedAmount,
    projectId: Number(id),
  };

  return (
    <article className="relative overflow-clip">
      {/* ── 背景装饰光晕 ── */}
      <div className="pointer-events-none absolute -top-20 right-[-10%] h-[36rem] w-[36rem] rounded-full aura-cyan-xl opacity-40" />
      <div className="pointer-events-none absolute left-[-15%] top-[60%] h-[28rem] w-[28rem] rounded-full aura-gold-lg opacity-30" />

      <div className="container-page relative pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24">
        {/* ── 项目横向切换画廊 ── */}
        <div>
          <ProjectStrip projects={stripProjects} currentId={Number(id)} />
        </div>

        {/* ════════════════════════════════════════════
            两栏布局：左内容 + 右 sticky 捐赠栏
            （从项目画廊之后立即开始，提升信息密度）
            ════════════════════════════════════════════ */}
        <div className="mt-6 lg:flex lg:gap-10 sm:mt-8">
          {/* ── 左栏：内容区 ── */}
          <div className="min-w-0 lg:flex-1">
            {/* ── 移动端项目信息（lg 以下显示） ── */}
            <div className="lg:hidden">
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-ukraine-blue-50 px-3 py-1 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-blue-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-[2rem] font-bold leading-[1.08] tracking-[-0.02em] text-ukraine-blue-900 sm:text-[2.5rem]">
                {title}
              </h1>
              {detail && (
                <p className="mt-3 font-[family-name:var(--font-display)] text-lg font-medium leading-snug text-ukraine-blue-700/80 sm:text-xl">
                  {detail.subtitle[typedLocale]}
                </p>
              )}
            </div>

            {/* ── 封面图 — 占满左栏宽度 ── */}
            <div className="relative mt-5 aspect-[3/2] overflow-hidden rounded-2xl lg:mt-0">
              <Image
                src={cover}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 56vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>

            {/* ── 正文段落 ── */}
            {detail && (
              <section className="mt-10 max-w-3xl sm:mt-12">
                {detail.body.map((paragraph, i) =>
                  i === 0 ? (
                    <p
                      key={i}
                      className="font-[family-name:var(--font-display)] text-xl leading-[1.6] tracking-tight text-ukraine-blue-900 sm:text-[1.35rem] sm:leading-[1.55]"
                    >
                      <span
                        className="float-left mt-1 mr-3 font-[family-name:var(--font-display)] text-[4.5rem] font-medium leading-[0.78] text-ukraine-gold-500 sm:mr-4 sm:text-[5.5rem]"
                        aria-hidden="true"
                      >
                        {paragraph[typedLocale].charAt(0)}
                      </span>
                      {paragraph[typedLocale].slice(1)}
                    </p>
                  ) : (
                    <p
                      key={i}
                      className="mt-5 text-lg leading-[1.75] text-ukraine-blue-800/85 sm:text-[1.1rem]"
                    >
                      {paragraph[typedLocale]}
                    </p>
                  ),
                )}
              </section>
            )}

            {/* ── Benefits 列表 ── */}
            {detail?.benefits && detail.benefits.length > 0 && (
              <section className="mt-8 max-w-3xl">
                <ul className="space-y-4">
                  {detail.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3.5">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ukraine-blue-50">
                        <Check
                          className="h-3.5 w-3.5 text-ukraine-blue-500"
                          strokeWidth={3}
                        />
                      </span>
                      <span className="text-lg leading-relaxed text-ukraine-blue-800/90">
                        {benefit[typedLocale]}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── 文档预览区 ── */}
            {detail?.documents && detail.documents.length > 0 && (
              <DocumentViewer documents={detail.documents} />
            )}

            {/* ── 故事区 ── */}
            {detail?.stories && detail.stories.length > 0 && (
              <PatientStories
                stories={detail.stories}
                storiesHeader={detail.storiesHeader}
                locale={typedLocale}
                projectId={Number(id)}
              />
            )}
          </div>

          {/* ── 右栏：桌面端项目信息 + sticky 捐赠栏 ── */}
          <aside className="hidden shrink-0 lg:flex lg:w-[360px] lg:flex-col xl:w-[400px]">
            <div className="sticky top-24">
              {/* 桌面端项目信息 */}
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-ukraine-blue-50 px-3 py-1 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-blue-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 font-[family-name:var(--font-display)] text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-ukraine-blue-900 xl:text-[2rem]">
                {title}
              </p>
              {detail && (
                <p className="mt-2.5 font-[family-name:var(--font-display)] text-base font-medium leading-snug text-ukraine-blue-700/80 xl:text-lg">
                  {detail.subtitle[typedLocale]}
                </p>
              )}

              <div className="mt-6">
                <DonationSidebar {...sidebarProps} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── 移动端捐赠浮窗（lg 以下显示） ── */}
      <div className="lg:hidden">
        <MobileDonationSheet {...sidebarProps} />
      </div>
    </article>
  );
}
