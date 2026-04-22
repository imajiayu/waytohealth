import { Link } from '@/i18n/navigation';
import { type Locale } from '@/i18n/config';
import { type Tag } from '@/data/news';

// 聚合后的 tag + 频次；按 count desc 排好序后传入
export interface TagWithCount extends Tag {
  count: number;
}

interface TagFilterBarProps {
  tags: TagWithCount[];
  activeTag: string | null;   // 当前 ?tag= 的 en 值（小写），null = 全部
  locale: Locale;
  allLabel: string;           // "Усі теми" / "All topics"
  filterLabel: string;        // "Фільтр за темою" / "Filter by topic"
  totalCount: number;         // 全集合数量
}

// 胶囊样式：和移动端 chips + 卡片上的 tag 三处保持视觉一致
const basePill =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors whitespace-nowrap';
const activePill = `${basePill} bg-ukraine-blue-500 text-white shadow-sm`;
const idlePill = `${basePill} bg-ukraine-blue-50 text-ukraine-blue-500 hover:bg-ukraine-blue-100 hover:text-ukraine-blue-600`;

function PillCount({ n, isActive }: { n: number; isActive: boolean }) {
  return (
    <span className={`tabular-nums ${isActive ? 'opacity-75' : 'opacity-60'}`}>
      {n}
    </span>
  );
}

export default function TagFilterBar({
  tags,
  activeTag,
  locale,
  allLabel,
  filterLabel,
  totalCount,
}: TagFilterBarProps) {
  if (tags.length === 0) return null;

  const renderPill = (
    href: string,
    label: string,
    count: number,
    isActive: boolean,
    key?: string,
  ) => (
    <Link
      key={key}
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={isActive ? activePill : idlePill}
    >
      <span>{label}</span>
      <PillCount n={count} isActive={isActive} />
    </Link>
  );

  return (
    <>
      {/* 桌面：左侧 sticky rail — flex-wrap 多胶囊换行 */}
      <aside
        aria-label={filterLabel}
        className="hidden lg:block lg:sticky lg:top-20 lg:self-start"
      >
        <div className="flex items-center gap-3">
          <div className="h-[2px] w-6 rounded-full bg-ukraine-gold-500" aria-hidden />
          <span className="font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.3em] text-gray-500">
            {filterLabel}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {renderPill('/news', allLabel, totalCount, activeTag === null)}
          {tags.map((tag) => {
            const key = tag.en.toLowerCase();
            const isActive = activeTag === key;
            return renderPill(
              `/news?tag=${encodeURIComponent(key)}`,
              tag[locale],
              tag.count,
              isActive,
              key,
            );
          })}
        </div>
      </aside>

      {/* 移动：顶部横向 chips 条 */}
      <div className="lg:hidden" aria-label={filterLabel}>
        <div className="flex items-center gap-3">
          <div className="h-px w-6 rounded-full bg-ukraine-blue-200" aria-hidden />
          <span className="font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.28em] text-gray-500">
            {filterLabel}
          </span>
        </div>
        <div className="hide-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          {renderPill('/news', allLabel, totalCount, activeTag === null)}
          {tags.map((tag) => {
            const key = tag.en.toLowerCase();
            const isActive = activeTag === key;
            return renderPill(
              `/news?tag=${encodeURIComponent(key)}`,
              tag[locale],
              tag.count,
              isActive,
              key,
            );
          })}
        </div>
      </div>
    </>
  );
}
