import { getProject, getAllProjects } from '@/lib/data';
import { getAllProjectAmounts } from '@/lib/projectAmounts';
import { toLocale } from '@/i18n/config';
import { buildAlternates, buildOpenGraph, buildTwitter } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import DonationSidebar from '@/components/projects/DonationSidebar';
// 移动端 donation sheet 只在 lg 以下显示；dynamic + 媒体查询在 MobileDonationSheetMount 里处理
import MobileDonationSheetMount from '@/components/projects/MobileDonationSheetMount';
import DocumentViewer from '@/components/common/DocumentViewer';
import { getTranslations } from 'next-intl/server';
import PatientStories from '@/components/projects/PatientStories';
import ProjectStrip from '@/components/projects/ProjectStrip';
import ProjectGallery from '@/components/projects/ProjectGallery';
import ProjectHeroImage from '@/components/projects/ProjectHeroImage';
import RecoveryJourney from '@/components/projects/RecoveryJourney';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const { id } = await searchParams;
  const typedLocale = toLocale(locale);

  try {
    const allProjects = await getAllProjects();
    const projectId = id ? Number(id) : allProjects[0]?.id;
    if (!projectId) return { title: 'Projects' };

    const project = await getProject(projectId);
    const title = project.title[typedLocale];
    const description = project.description[typedLocale];
    // 项目详情页 URL 含 ?id=N；sitemap 已列出每个 id，这里 canonical / alternates 也带上
    const pathWithId = `/projects?id=${projectId}`;
    const cover = `/data/projects/${projectId}/cover.webp`;
    return {
      title,
      description,
      alternates: buildAlternates(typedLocale, pathWithId),
      openGraph: buildOpenGraph({ title, description, locale: typedLocale, path: pathWithId, image: cover }),
      twitter: buildTwitter({ title, description, image: cover }),
    };
  } catch {
    return { title: 'Projects' };
  }
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { id } = await searchParams;
  const typedLocale = toLocale(locale);

  const [allProjects, amounts] = await Promise.all([
    getAllProjects(),
    getAllProjectAmounts(),
  ]);

  // 无 id 参数时自动选择第一个项目
  const projectId = id ? Number(id) : allProjects[0]?.id;
  if (!projectId) notFound();

  let project;
  try {
    project = await getProject(projectId);
  } catch {
    notFound();
  }
  const stripProjects = allProjects.map((p) => ({
    id: p.id,
    data: {
      title: p.title,
      description: p.description,
      goal_amount: p.goal_amount,
      // 已筹金额从 Neon 表 project_amounts 读（admin 维护）；缺记录降级为 0
      raised_amount: amounts.get(p.id) ?? 0,
      currency: p.currency,
      tags: p.tags,
    },
    cover: p.cover,
  }));

  const title = project.title[typedLocale];
  const detail = project.detail;

  // 当前项目的实时已筹金额（复用上面的 amounts map，避免二次查询）
  const raisedAmount = amounts.get(projectId) ?? 0;

  // 文档查看器通用标签
  const t = await getTranslations('projectDetail');
  const docViewerLabels = {
    title: t('documentsTitle'),
    expand: t('expand'),
    collapse: t('collapse'),
    download: t('download'),
    close: t('close'),
    loadError: t('loadError'),
  };

  // 捐赠栏的 props — 复用于桌面和移动端
  const sidebarProps = {
    goalAmount: project.goal_amount,
    raisedAmount,
    projectTitle: title,
    monobankJarSendId: project.monobankJarSendId,
  };

  return (
    <article className="relative overflow-clip">
      {/* ── 背景装饰光晕 ── */}
      <div className="pointer-events-none absolute -top-20 right-[-10%] h-[36rem] w-[36rem] rounded-full aura-cyan-xl opacity-40" />
      <div className="pointer-events-none absolute left-[-15%] top-[60%] h-[28rem] w-[28rem] rounded-full aura-gold-lg opacity-30" />

      <div className="container-page relative pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24">
        {/* ── 项目横向切换画廊 ── */}
        <div>
          <ProjectStrip projects={stripProjects} currentId={projectId} />
        </div>

        {/* ════════════════════════════════════════════
            两栏布局：左内容 + 右 sticky 捐赠栏
            ════════════════════════════════════════════ */}
        <div className="mt-6 lg:flex lg:gap-10 sm:mt-8">
          {/* ── 左栏：内容区 ── */}
          <div className="min-w-0 lg:flex-1">
            {/* ── 项目信息（标签 + 标题 + 副标题） ── */}
            <div>
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
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-[2rem] font-bold leading-[1.08] tracking-[-0.02em] text-ukraine-blue-900 sm:text-[2.5rem] lg:text-[2.75rem]">
                {title}
              </h1>
              {detail && (
                <p className="mt-3 font-[family-name:var(--font-display)] text-lg font-medium leading-snug text-ukraine-blue-700/80 sm:text-xl">
                  {detail.subtitle[typedLocale]}
                </p>
              )}
              {/* 标题下方装饰分隔线 */}
              <div className="mt-6 h-px w-full bg-ukraine-blue-100/60 sm:mt-8" />
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

            {/* ── 内容配图（点击放大；统一比例，按 object-cover 裁剪） ──
                 完全无图的项目（contentImages + gallery + stories 照片都为空）
                 降级为单图 hero —— 把项目卡的 cover 当唯一插图。 */}
            {(() => {
              const galleryImages = [
                ...(detail?.contentImages ?? []),
                ...(detail?.gallery ?? []),
              ];
              if (galleryImages.length > 0) {
                return (
                  <ProjectGallery
                    images={galleryImages}
                    basePath={`/data/projects/${projectId}`}
                    alt={title}
                  />
                );
              }
              const hasStoryPhotos = (detail?.stories ?? []).some(
                (s) => s.photo || s.photoBefore || s.photoAfter,
              );
              if (hasStoryPhotos) return null;
              return (
                <ProjectHeroImage
                  src={`/data/projects/${projectId}/cover.webp`}
                  alt={title}
                  projectId={projectId}
                />
              );
            })()}


            {/* ── 康复旅程阶段 ── */}
            {detail?.stages && detail.stages.length > 0 && (
              <RecoveryJourney stages={detail.stages} locale={typedLocale} />
            )}

            {/* ── 文档预览区 ── */}
            {detail?.documents && detail.documents.length > 0 && (
              <DocumentViewer
                documents={detail.documents.map(d => ({ label: d.label[typedLocale], url: d.url }))}
                labels={docViewerLabels}
              />
            )}

            {/* ── 故事区 ── */}
            {detail?.stories && detail.stories.length > 0 && (
              <PatientStories
                stories={detail.stories}
                storiesHeader={detail.storiesHeader}
                locale={typedLocale}
                projectId={projectId}
              />
            )}
          </div>

          {/* ── 右栏：sticky 捐赠栏 ── */}
          <aside className="hidden shrink-0 lg:flex lg:w-[360px] lg:flex-col xl:w-[400px]">
            <div className="sticky top-24">
              <DonationSidebar {...sidebarProps} />
            </div>
          </aside>
        </div>
      </div>

      {/* ── 移动端捐赠浮窗（lg 以下显示） —— 桌面端完全跳过 JS，由 Mount wrapper 用媒体查询判定 ── */}
      <MobileDonationSheetMount {...sidebarProps} />
    </article>
  );
}
