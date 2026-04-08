type Props = {
  /** 章节编号，例如 "01" */
  number: string;
  /** 章节标签 */
  label: string;
};

/**
 * 杂志编辑式章节标记 ── 大号金色编号 + 「Chapter / 标签」垂直排版
 * 用于 about 页与首页等需要章节标识的位置，保持视觉一致
 */
export default function ChapterMark({ number, label }: Props) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-[family-name:var(--font-display)] text-[3.5rem] font-light leading-none text-ukraine-gold-500 sm:text-[4.5rem]">
        {number}
      </span>
      <div className="flex flex-col gap-1">
        <span className="h-px w-10 bg-ukraine-blue-300" />
        <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.28em] text-ukraine-blue-600 sm:text-xs">
          Chapter
        </span>
        <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-ukraine-blue-900 sm:text-lg">
          {label}
        </span>
      </div>
    </div>
  );
}
