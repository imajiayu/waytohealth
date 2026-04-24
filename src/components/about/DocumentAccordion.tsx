'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown, Download, Maximize2, X } from 'lucide-react';

export interface AccordionDocument {
  title: string;
  href: string;
  size: string;
}

interface AccordionLabels {
  title: string;
  expand: string;
  collapse: string;
  download: string;
  close: string;
}

interface Props {
  documents: AccordionDocument[];
  labels: AccordionLabels;
}

function DocumentRow({
  doc,
  index,
  isOpen,
  onToggle,
  labels,
}: {
  doc: AccordionDocument;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  labels: AccordionLabels;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // 测量展开内容高度
  useEffect(() => {
    if (isOpen && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  const id = String(index + 1).padStart(2, '0');

  return (
    <li className="border-b border-ukraine-blue-100/80 last:border-b-0">
      {/* 行标题 — 可点击 */}
      <button
        type="button"
        onClick={onToggle}
        className={`group flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors duration-200 sm:gap-4 md:px-6 md:py-5 ${
          isOpen
            ? 'bg-ukraine-blue-50/50'
            : 'hover:bg-ukraine-gold-50/40'
        }`}
      >
        {/* 编号 */}
        <span className="font-[family-name:var(--font-data)] text-xs font-semibold tabular-nums text-ukraine-gold-600 sm:text-sm">
          {id}
        </span>

        {/* 标题 */}
        <span className="min-w-0 flex-1">
          <span className={`block font-[family-name:var(--font-display)] text-[14px] font-semibold leading-snug tracking-tight transition-colors duration-200 sm:text-lg ${
            isOpen ? 'text-ukraine-blue-700' : 'text-ukraine-blue-900 group-hover:text-ukraine-blue-700'
          }`}>
            {doc.title}
          </span>
          {/* 移动端元信息 */}
          <span className="mt-0.5 block font-[family-name:var(--font-data)] text-[9px] uppercase tracking-[0.2em] text-ukraine-blue-400 md:hidden">
            PDF · {doc.size}
          </span>
        </span>

        {/* PDF 标签 — 桌面 */}
        <span className="hidden font-[family-name:var(--font-data)] text-[11px] font-medium uppercase tracking-[0.22em] text-ukraine-blue-500 md:block">
          PDF
        </span>

        {/* 文件大小 — 桌面 */}
        <span className="hidden w-20 text-right font-[family-name:var(--font-data)] text-sm font-medium tabular-nums text-ukraine-blue-700 md:block">
          {doc.size}
        </span>

        {/* 展开箭头 */}
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 sm:h-8 sm:w-8 ${
          isOpen
            ? 'border-ukraine-blue-300 bg-ukraine-blue-500 text-white'
            : 'border-ukraine-blue-200 text-ukraine-blue-400 group-hover:border-ukraine-gold-500 group-hover:text-ukraine-gold-600'
        }`}>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 sm:h-4 sm:w-4 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* 展开内容 — PDF 预览 */}
      <div
        className="overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ maxHeight: isOpen ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef}>
          <div className="px-4 pb-4 md:px-6 md:pb-6">
            <div className="overflow-hidden rounded-xl border border-ukraine-blue-100/60 bg-white shadow-[0_2px_12px_rgba(0,108,178,0.06)]">
              {/* 工具栏 */}
              <div className="flex items-center justify-between border-b border-ukraine-blue-100/60 bg-ukraine-blue-50/30 px-4 py-2">
                <span className="font-[family-name:var(--font-data)] text-xs font-medium text-ukraine-blue-500">
                  {doc.title}
                  <span className="ml-2 uppercase text-ukraine-blue-400">.pdf</span>
                </span>
                <div className="flex items-center gap-1">
                  {/* 全屏 */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFullscreen(!fullscreen); }}
                    className="cursor-pointer rounded-md p-1.5 text-ukraine-blue-400 transition-colors hover:bg-ukraine-blue-100/60 hover:text-ukraine-blue-600"
                    title={fullscreen ? labels.collapse : labels.expand}
                    aria-label={fullscreen ? labels.collapse : labels.expand}
                  >
                    {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  {/* 下载 */}
                  <a
                    href={doc.href}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md p-1.5 text-ukraine-blue-400 transition-colors hover:bg-ukraine-blue-100/60 hover:text-ukraine-blue-600"
                    title={labels.download}
                    aria-label={labels.download}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {/* 关闭 */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggle(); setFullscreen(false); }}
                    className="cursor-pointer rounded-md p-1.5 text-ukraine-blue-400 transition-colors hover:bg-ukraine-blue-100/60 hover:text-ukraine-blue-600"
                    title={labels.close}
                    aria-label={labels.close}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* PDF 预览 */}
              <div className={`transition-all duration-300 ${fullscreen ? 'h-[85vh]' : 'h-[380px] sm:h-[600px]'}`}>
                <iframe
                  src={doc.href}
                  className="h-full w-full border-0"
                  title={doc.title}
                  sandbox="allow-same-origin allow-scripts allow-downloads allow-popups"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function DocumentAccordion({ documents, labels }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-ukraine-blue-900 sm:text-3xl">
        {labels.title}
      </h2>

      <div className="mt-4 overflow-hidden rounded-[6px] border border-ukraine-blue-100 bg-white/60 backdrop-blur-sm sm:mt-6">
        {/* 表头 — 桌面端 */}
        <div className="hidden items-center gap-4 border-b border-ukraine-blue-100 bg-ukraine-blue-50/40 px-6 py-3 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-600 md:flex">
          <span className="w-8">№</span>
          <span className="flex-1">
            <FileText className="inline h-3 w-3 mr-1.5 -mt-0.5" />
            {labels.title}
          </span>
          <span>Format</span>
          <span className="w-20 text-right">Size</span>
          <span className="w-8" />
        </div>

        <ul>
          {documents.map((doc, i) => (
            <DocumentRow
              key={doc.href}
              doc={doc}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              labels={labels}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
