import { getTranslations } from 'next-intl/server';
import { getAllProjects } from '@/lib/data';
import ProjectCard from '@/components/projects/ProjectCard';
import ChapterIndex, { type ChapterEntry } from '@/components/shared/ChapterIndex';

export default async function ProjectsSection() {
  const [t, tNav, tChapters, projects] = await Promise.all([
    getTranslations('projects'),
    getTranslations('navigation'),
    getTranslations('homeChapters'),
    getAllProjects(),
  ]);

  const mainProjects = projects.slice(0, 6);
  const otherProjects = projects.slice(6);

  // 章节导航 ── 仅在第一个 section 的左侧渲染，作为整页的目录
  const chapters: ChapterEntry[] = [
    { key: 'projects', number: '01', label: tChapters('items.projects'), href: '#projects' },
    { key: 'about', number: '02', label: tChapters('items.about'), href: '#about' },
    { key: 'values', number: '03', label: tChapters('items.values'), href: '#values' },
    { key: 'achievements', number: '04', label: tChapters('items.achievements'), href: '#achievements' },
  ];

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
        <div className="grid grid-cols-12 gap-6 sm:gap-8">
          {/* 左侧 ── 章节导航（整页目录） */}
          <aside className="col-span-12 lg:col-span-3 lg:pt-2">
            <ChapterIndex chapters={chapters} />
          </aside>

          {/* 右侧 ── 区域头部 + 内容 */}
          <div className="col-span-12 lg:col-span-9 lg:pl-4">
            {/* 区域头部 — 编辑式排版 */}
            <div>
              <span className="font-[family-name:var(--font-data)] text-xs font-medium uppercase tracking-[0.2em] text-ukraine-blue-400">
                {tNav('projects')}
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ukraine-blue-900 sm:text-4xl">
                {t('title')}
              </h2>
              <div className="mt-3 accent-line" />
            </div>
          </div>
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

        {/* 更多项目 — 嵌入子区块 */}
        {otherProjects.length > 0 && (
          <div className="mt-10 sm:mt-12">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ukraine-blue-800 sm:text-2xl">
                {t('otherProjectsTitle')}
              </h3>
              <div className="mt-2 h-[2px] w-10 rounded-full bg-ukraine-gold-500" />
            </div>

            {/* 紧凑卡片 5 列 */}
            <div className="mt-2 grid gap-3 grid-cols-2 sm:mt-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-5">
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
