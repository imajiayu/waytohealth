import fs from 'node:fs';
import path from 'node:path';

type DocumentItem = {
  title: string;
  href: string;
};

type Props = {
  documents: DocumentItem[];
  /** 表头文案：编号、文件、格式、大小、操作 */
  labels: {
    id: string;
    file: string;
    type: string;
    size: string;
    format: string;
    open: string;
  };
};

/** 服务端读取 PDF 文件大小（KB / MB） */
function getFileSize(href: string): string {
  try {
    const filepath = path.join(process.cwd(), 'public', href.replace(/^\//, ''));
    const stats = fs.statSync(filepath);
    const kb = stats.size / 1024;
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${Math.round(kb)} KB`;
  } catch {
    return '—';
  }
}

/**
 * 账簿/索引风格的文档列表
 * - 表头 + 行式排版，去掉卡片化处理
 * - 每行：编号 / 标题 / 格式 / 大小 / 跳转
 * - hover 时整行金色描边
 */
export default function DocumentLedger({ documents, labels }: Props) {
  return (
    <div className="overflow-hidden rounded-[6px] border border-ukraine-blue-100 bg-white/60 backdrop-blur-sm">
      {/* 表头 */}
      <div className="hidden grid-cols-[60px_1fr_120px_100px_60px] items-center gap-4 border-b border-ukraine-blue-100 bg-ukraine-blue-50/40 px-6 py-3 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-600 md:grid">
        <span>{labels.id}</span>
        <span>{labels.file}</span>
        <span>{labels.type}</span>
        <span className="text-right">{labels.size}</span>
        <span className="text-right">{labels.open}</span>
      </div>

      <ul>
        {documents.map((doc, i) => {
          const size = getFileSize(doc.href);
          const id = String(i + 1).padStart(2, '0');

          return (
            <li
              key={doc.href}
              className="border-b border-ukraine-blue-100 last:border-b-0"
            >
              <a
                href={doc.href}
                target="_blank"
                rel="noreferrer"
                className="group grid grid-cols-[40px_1fr_60px] items-center gap-4 px-5 py-5 transition-colors duration-300 hover:bg-ukraine-gold-50/60 md:grid-cols-[60px_1fr_120px_100px_60px] md:px-6 md:py-5"
              >
                {/* 编号 */}
                <span className="font-[family-name:var(--font-data)] text-sm font-semibold text-ukraine-gold-600 tabular-nums">
                  {id}
                </span>

                {/* 标题 */}
                <span className="min-w-0">
                  <span className="block font-[family-name:var(--font-display)] text-base font-semibold leading-snug text-ukraine-blue-900 transition-colors duration-300 group-hover:text-ukraine-blue-700 sm:text-lg">
                    {doc.title}
                  </span>
                  {/* 移动端：在标题下显示元信息 */}
                  <span className="mt-1 block font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.2em] text-ukraine-blue-400 md:hidden">
                    {labels.format} · {size}
                  </span>
                </span>

                {/* 类型 ── 桌面端单独列 */}
                <span className="hidden font-[family-name:var(--font-data)] text-[11px] font-medium uppercase tracking-[0.22em] text-ukraine-blue-500 md:block">
                  {labels.format} · A4
                </span>

                {/* 大小 */}
                <span className="hidden text-right font-[family-name:var(--font-data)] text-sm font-medium tabular-nums text-ukraine-blue-700 md:block">
                  {size}
                </span>

                {/* 跳转箭头 */}
                <span className="flex justify-end">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ukraine-blue-200 text-ukraine-blue-500 transition-all duration-300 group-hover:border-ukraine-gold-500 group-hover:bg-ukraine-gold-500 group-hover:text-ukraine-blue-900">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
