import { getTranslations } from 'next-intl/server';
import { getAllProjects } from '@/lib/data';
import ProjectCard from '@/components/projects/ProjectCard';

export default async function ProjectsSection() {
  const t = await getTranslations('projects');
  const tNav = await getTranslations('navigation');
  const projects = await getAllProjects();

  const mainProjects = projects.slice(0, 3);
  const otherProjects = projects.slice(3);

  return (
    <>
      {/* 主项目 section */}
      <section id="projects" className="scroll-mt-16 overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">

        <div className="container-page">
          {/* 区域头部 — 编辑式排版 */}
          <div>
            <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
              {tNav('projects')}
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
              {t('title')}
            </h2>
            <div className="mt-3 h-[2px] w-12 rounded-full bg-ukraine-gold-500" />
          </div>

          {/* 主项目卡片网格 — 大卡片 3 列 */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
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
        </div>
      </section>

      {/* 更多项目 section */}
      {otherProjects.length > 0 && (
        <section className="overflow-hidden pb-24 sm:pb-32">

          <div className="container-page">
            {/* 区域标题 */}
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ukraine-blue-800 sm:text-2xl">
                {t('otherProjectsTitle')}
              </h3>
              <div className="mt-2 h-[2px] w-10 rounded-full bg-ukraine-gold-500" />
            </div>

            {/* 紧凑卡片 4 列 */}
            <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {otherProjects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  data={project}
                  cover={project.cover}
                  index={i + 3}
                  compact
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
