export type ChapterEntry = {
  /** 唯一 key */
  key: string;
  /** 章节编号，例如 "01" */
  number: string;
  /** 章节标签 */
  label: string;
  /** 锚点链接，例如 "#chapter-origin" */
  href: string;
};

type Props = {
  chapters: ChapterEntry[];
  /** 无障碍标签，默认 "Chapter index" */
  ariaLabel?: string;
};

/**
 * 杂志目录式章节导航 ── 金色左边线 + 编号 + 斜体标签
 * 点击锚点跳转，依赖 globals.css 中的 `html { scroll-behavior: smooth }`
 */
export default function ChapterIndex({ chapters, ariaLabel = 'Chapter index' }: Props) {
  return (
    <nav
      aria-label={ariaLabel}
      className="space-y-5 border-l-2 border-ukraine-gold-500 pl-5 lg:space-y-6"
    >
      {chapters.map((chapter) => (
        <a key={chapter.key} href={chapter.href} className="group flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-display)] text-base font-light leading-none text-ukraine-gold-500 sm:text-lg">
            {chapter.number}
          </span>
          <span className="font-[family-name:var(--font-display)] text-sm italic text-ukraine-blue-700 transition-colors group-hover:text-ukraine-blue-900 sm:text-base">
            {chapter.label}
          </span>
        </a>
      ))}
    </nav>
  );
}
