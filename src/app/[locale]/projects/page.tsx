import { getTranslations } from 'next-intl/server';
import { getAllProjects } from '@/lib/data';
import ProjectCard from '@/components/projects/ProjectCard';

export default async function ProjectsPage() {
  const t = await getTranslations('projects');
  const projects = await getAllProjects();

  return (
    <div className="container-page py-24">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-gray-900 sm:text-5xl">
          {t('title')}
        </h1>
        <div className="mx-auto mt-3 h-px bg-gradient-to-r from-transparent via-ukraine-gold-400 to-transparent w-32" />
      </div>

      {/* 项目卡片网格 */}
      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
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
  );
}
