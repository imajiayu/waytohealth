'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown, Download, Maximize2, Minimize2 } from 'lucide-react';

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
    <li
      className={`overflow-hidden rounded-2xl border bg-white/70 backdrop-blur-sm transition-all duration-300 ${
        isOpen
          ? 'border-ukraine-blue-300 shadow-[0_8px_28px_rgba(0,108,178,0.12)]'
          : 'border-ukraine-blue-100/80 hover:border-ukraine-blue-200 hover:shadow-[0_4px_16px_rgba(0,108,178,0.08)]'
      }`}
    >
      {/* 行标题 — 可点击 */}
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full cursor-pointer items-center gap-3.5 px-4 py-4 text-left sm:gap-4 sm:px-6 sm:py-5"
      >
        {/* 编号徽章 */}
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-[family-name:var(--font-data)] text-sm font-semibold tabular-nums transition-colors duration-300 ${
            isOpen
              ? 'bg-ukraine-blue-500 text-white'
              : 'bg-ukraine-blue-50 text-ukraine-gold-600 group-hover:bg-ukraine-blue-100'
          }`}
        >
          {id}
        </span>

        {/* 标题 + 元信息（PDF · 大小 合并到一处） */}
        <span className="min-w-0 flex-1">
          <span
            className={`block font-[family-name:var(--font-display)] text-[15px] font-semibold leading-snug tracking-tight transition-colors duration-200 sm:text-lg ${
              isOpen ? 'text-ukraine-blue-700' : 'text-ukraine-blue-900 group-hover:text-ukraine-blue-700'
            }`}
          >
            {doc.title}
          </span>
          <span className="mt-1 flex items-center gap-1.5 font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.18em] text-ukraine-blue-400">
            <FileText className="h-3 w-3" />
            PDF
            <span className="text-ukraine-blue-200">·</span>
            <span className="tabular-nums">{doc.size}</span>
          </span>
        </span>

        {/* 展开箭头 */}
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen
              ? 'border-ukraine-blue-500 bg-ukraine-blue-500 text-white'
              : 'border-ukraine-blue-200 text-ukraine-blue-400 group-hover:border-ukraine-gold-500 group-hover:text-ukraine-gold-600'
          }`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* 展开内容 — PDF 预览 */}
      <div
        className="overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ maxHeight: isOpen ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef}>
          <div className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="overflow-hidden rounded-xl border border-ukraine-blue-100/60 bg-ukraine-blue-50/20">
              {/* 操作条 — 只放操作按钮，不再重复文件名/格式；收起靠行箭头 */}
              <div className="flex items-center justify-end gap-1 border-b border-ukraine-blue-100/60 px-2 py-1.5">
                {/* 全屏放大 / 还原 */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFullscreen(!fullscreen); }}
                  className="cursor-pointer rounded-md p-1.5 text-ukraine-blue-400 transition-colors hover:bg-ukraine-blue-100/60 hover:text-ukraine-blue-600"
                  title={fullscreen ? labels.collapse : labels.expand}
                  aria-label={fullscreen ? labels.collapse : labels.expand}
                >
                  {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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
              </div>

              {/* PDF 预览 — 用 <object> 而非 <iframe sandbox>：Chrome 内置 PDF Viewer 在
                  sandboxed iframe 里会被拒绝加载（呈现为"此页面已被 Chrome 屏蔽"），object 走
                  浏览器原生 PDF 处理通道、不受 iframe sandbox 影响。同源首方静态资产，安全无损 */}
              <div className={`transition-all duration-300 ${fullscreen ? 'h-[85vh]' : 'h-[380px] sm:h-[600px]'}`}>
                <object
                  data={doc.href}
                  type="application/pdf"
                  className="h-full w-full"
                  aria-label={doc.title}
                >
                  <div className="flex h-full items-center justify-center p-4 text-center text-sm text-ukraine-blue-400">
                    <a
                      href={doc.href}
                      download
                      className="text-ukraine-blue-600 underline hover:text-ukraine-blue-700"
                    >
                      {labels.download}
                    </a>
                  </div>
                </object>
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

      <ul className="mt-5 flex flex-col gap-3 sm:mt-6">
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
    </section>
  );
}
