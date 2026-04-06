import { getTranslations } from 'next-intl/server';
import { getAllProjects } from '@/lib/data';
import ProjectCard from '@/components/projects/ProjectCard';

export default async function ProjectsSection() {
  const [t, tNav, projects] = await Promise.all([
    getTranslations('projects'),
    getTranslations('navigation'),
    getAllProjects(),
  ]);

  const mainProjects = projects.slice(0, 6);
  const otherProjects = projects.slice(6);

  return (
    <>
      {/* 主项目 section */}
      <section id="projects" className="scroll-mt-16 overflow-x-clip pt-16 pb-6 sm:pt-20 sm:pb-8">

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
          <div className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
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
        <section className="overflow-x-clip pt-6 pb-12 sm:pt-8 sm:pb-16">

          <div className="container-page">
            {/* 区域标题 */}
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ukraine-blue-800 sm:text-2xl">
                {t('otherProjectsTitle')}
              </h3>
              <div className="mt-2 h-[2px] w-10 rounded-full bg-ukraine-gold-500" />
            </div>

            {/* 紧凑卡片 5 列 */}
            <div className="mt-5 grid gap-3 grid-cols-2 sm:mt-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-5">
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
        </section>
      )}
    </>
  );
}
