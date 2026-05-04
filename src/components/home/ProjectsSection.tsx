import { getTranslations, getLocale } from 'next-intl/server';
import { getAllProjects } from '@/lib/data';
import { getAllJarBalances } from '@/lib/monobank';
import { toLocale } from '@/i18n/config';
import ProjectCard from '@/components/projects/ProjectCard';
import MobileProjectSwitcher from '@/components/home/MobileProjectSwitcher';

export default async function ProjectsSection() {
  const [t, tNav, rawProjects, rawLocale, jarBalances] = await Promise.all([
    getTranslations('projects'),
    getTranslations('navigation'),
    getAllProjects(),
    getLocale(),
    getAllJarBalances().catch(() => new Map<string, number>()),
  ]);
  const locale = toLocale(rawLocale);

  // 一次拉所有 jar，按 sendId 查每个项目的实时已筹金额；缺 sendId / jar 不可用降级为 0
  const projects = rawProjects.map((p) => ({
    ...p,
    raised_amount: p.monobankJarSendId ? jarBalances.get(p.monobankJarSendId) ?? 0 : 0,
  }));

  const mainProjects = projects.slice(0, 6);
  const otherProjects = projects.slice(6);

  return (
    <section id="projects" className="section-y relative scroll-mt-16 overflow-x-clip">
      {/* 背景装饰 — 右上角主光源(柔光球) */}
      <div className="aura-cyan-xl pointer-events-none absolute -right-40 -top-32 h-[800px] w-[800px] rounded-full opacity-80 blur-3xl" />
      {/* 背景装饰 — 左下角次光源(冷蓝呼应) */}
      <div className="aura-blue-lg pointer-events-none absolute -left-32 bottom-20 h-[420px] w-[420px] rounded-full opacity-70 blur-3xl" />
      {/* 背景装饰 — 描边圆环(治愈/精密感) */}
      <div className="pointer-events-none absolute right-[6%] top-24 hidden lg:block">
        <div className="h-72 w-72 rounded-full border border-ukraine-blue-200/50" />
        <div className="absolute inset-6 rounded-full border border-ukraine-blue-100/40" />
      </div>

      <div className="container-page relative">
        {/* 区域头部 — 编辑式排版 */}
        <div>
          <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
            {tNav('projects')}
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
            {t('title')}
          </h2>
          <div className="mt-2 accent-line" />
        </div>

        {/* 移动端：缩略图导航 + 单张当前卡片（折叠纵向高度，不用滚很长） */}
        <div className="mt-2 sm:hidden">
          <MobileProjectSwitcher
            thumbs={mainProjects.map((p) => ({
              id: p.id,
              cover: p.cover,
              title: p.title[locale],
            }))}
          >
            {mainProjects.map((project, i) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                data={project}
                cover={project.cover}
                index={i}
                skipFadeIn
              />
            ))}
          </MobileProjectSwitcher>
        </div>

        {/* 桌面端：大卡片 3 列网格 */}
        <div className="hidden gap-6 sm:mt-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {mainProjects.map((project, i) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              data={project}
              cover={project.cover}
              index={i}
            />
          ))}
        </div>

        {/* 更多项目 — 嵌入子区块 */}
        {otherProjects.length > 0 && (
          <div className="mt-10 sm:mt-12">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ukraine-blue-800 sm:text-2xl">
                {t('otherProjectsTitle')}
              </h3>
              <div className="mt-2 accent-line" />
            </div>

            {/* 紧凑卡片 5 列 */}
            <div className="mt-2 grid gap-3 grid-cols-3 sm:mt-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-5">
              {otherProjects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  data={project}
                  cover={project.cover}
                  index={i + 6}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
