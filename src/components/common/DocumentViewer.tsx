'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, X, Download, Maximize2 } from 'lucide-react';

export interface ViewerDocument {
  label: string;
  url: string;
}

interface DocumentViewerLabels {
  title: string;
  expand: string;
  collapse: string;
  download: string;
  close: string;
  loadError: string;
}

interface DocumentViewerProps {
  documents: ViewerDocument[];
  labels: DocumentViewerLabels;
}

// 从 URL 推断文件类型
function getFileType(url: string): 'pdf' | 'xlsx' | 'unknown' {
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  return 'unknown';
}

// XLSX 表格渲染子组件
function ExcelPreview({ url, errorMessage }: { url: string; errorMessage: string }) {
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadExcel() {
      try {
        // 并行：按需下载 xlsx 运行时 + DOMPurify（都从 DocumentViewer chunk 分离，
        // 仅在真正打开 xlsx 时才拉）与获取文件
        const [XLSX, { default: DOMPurify }, res] = await Promise.all([
          import('xlsx'),
          import('isomorphic-dompurify'),
          fetch(url),
        ]);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });

        if (cancelled) return;

        const parsed = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const raw = XLSX.utils.sheet_to_html(ws, { editable: false });
          // 防御性 sanitize：即便目前 xlsx 是本站受控资产，DOMPurify 保证任何 <script>
          // 或事件处理器不会被注入到 dangerouslySetInnerHTML
          const html = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
          return { name, html };
        });

        setSheets(parsed);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadExcel();
    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ukraine-blue-200 border-t-ukraine-blue-500" />
      </div>
    );
  }

  if (error || sheets.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ukraine-blue-400">
        {errorMessage}
      </div>
    );
  }

  return (
    <div>
      {/* 工作表标签页（多 sheet 时显示） */}
      {sheets.length > 1 && (
        <div className="flex gap-1 border-b border-ukraine-blue-100 px-1 pt-1">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setActiveSheet(i)}
              className={`cursor-pointer rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors ${
                i === activeSheet
                  ? 'bg-white text-ukraine-blue-700 border border-b-0 border-ukraine-blue-100'
                  : 'text-ukraine-blue-400 hover:text-ukraine-blue-600'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* 表格内容 — HTML 由 SheetJS 生成后经 DOMPurify sanitize，防御任何嵌入脚本 */}
      <div
        className="excel-preview overflow-auto"
        dangerouslySetInnerHTML={{ __html: sheets[activeSheet].html }}
      />
    </div>
  );
}

/**
 * 通用文档查看器
 * - 支持 PDF 内嵌预览和 XLSX 表格渲染
 * - 带标签切换、全屏、下载功能
 */
export default function DocumentViewer({ documents, labels }: DocumentViewerProps) {
  // 默认选中第一个文档
  const [activeDoc, setActiveDoc] = useState<number | null>(0);
  const [expanded, setExpanded] = useState(false);

  // 只显示有实际文件 URL 的文档
  const viewableDocs = documents.filter((doc) => {
    const type = getFileType(doc.url);
    return type !== 'unknown' && doc.url !== '#';
  });

  if (viewableDocs.length === 0) return null;

  const currentDoc = activeDoc !== null ? viewableDocs[activeDoc] : null;
  const currentType = currentDoc ? getFileType(currentDoc.url) : null;

  // 点击已选中的文档时关闭，否则打开
  function handleDocClick(i: number) {
    if (activeDoc === i) {
      setActiveDoc(null);
      setExpanded(false);
    } else {
      setActiveDoc(i);
      setExpanded(false);
    }
  }

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ukraine-blue-900 sm:text-3xl">
        {labels.title}
      </h2>

      {/* 文档选择标签 */}
      <div className="mt-6 flex flex-wrap gap-2">
        {viewableDocs.map((doc, i) => {
          const type = getFileType(doc.url);
          const Icon = type === 'pdf' ? FileText : FileSpreadsheet;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDocClick(i)}
              className={`cursor-pointer flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                i === activeDoc
                  ? 'border-ukraine-blue-500 bg-ukraine-blue-500 text-white shadow-[0_2px_8px_rgba(0,108,178,0.3)]'
                  : 'border-ukraine-blue-100 bg-ukraine-blue-50/40 text-ukraine-blue-700 hover:border-ukraine-blue-300 hover:bg-ukraine-blue-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {doc.label}
            </button>
          );
        })}
      </div>

      {/* 预览区（仅在选中文档时显示） */}
      {currentDoc && currentType && (
        <div className="mt-4 overflow-hidden rounded-xl border border-ukraine-blue-100/60 bg-white shadow-[0_2px_12px_rgba(0,108,178,0.06)]">
          {/* 工具栏 */}
          <div className="flex items-center justify-between border-b border-ukraine-blue-100/60 bg-ukraine-blue-50/30 px-4 py-2">
            <span className="font-[family-name:var(--font-data)] text-xs font-medium text-ukraine-blue-500">
              {currentDoc.label}
              <span className="ml-2 uppercase text-ukraine-blue-400">
                .{currentType}
              </span>
            </span>
            <div className="flex items-center gap-1">
              {/* 全屏切换（仅 PDF） */}
              {currentType === 'pdf' && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="cursor-pointer rounded-md p-1.5 text-ukraine-blue-400 transition-colors hover:bg-ukraine-blue-100/60 hover:text-ukraine-blue-600"
                  title={expanded ? labels.collapse : labels.expand}
                  aria-label={expanded ? labels.collapse : labels.expand}
                >
                  {expanded ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              )}
              {/* 下载 */}
              <a
                href={currentDoc.url}
                download
                className="rounded-md p-1.5 text-ukraine-blue-400 transition-colors hover:bg-ukraine-blue-100/60 hover:text-ukraine-blue-600"
                title={labels.download}
                aria-label={labels.download}
              >
                <Download className="h-4 w-4" />
              </a>
              {/* 关闭 */}
              <button
                type="button"
                onClick={() => { setActiveDoc(null); setExpanded(false); }}
                className="cursor-pointer rounded-md p-1.5 text-ukraine-blue-400 transition-colors hover:bg-ukraine-blue-100/60 hover:text-ukraine-blue-600"
                title={labels.close}
                aria-label={labels.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 内容区 */}
          <div className={`transition-all duration-300 ${
            currentType === 'pdf'
              ? expanded ? 'h-[85vh]' : 'h-[500px] sm:h-[600px]'
              : 'max-h-[500px] sm:max-h-[600px] overflow-auto'
          }`}>
            {currentType === 'pdf' ? (
              // 用 <object> 而非 <iframe sandbox>：Chrome 内置 PDF Viewer 在 sandboxed
              // iframe 里会被拒绝加载（呈现为"此页面已被 Chrome 屏蔽"），object 走浏览器
              // 原生 PDF 处理通道、不受 iframe sandbox 影响。这里的 PDF 是同源首方静态
              // 资产，去掉 sandbox 不损失实际安全收益
              <object
                data={currentDoc.url}
                type="application/pdf"
                className="h-full w-full"
                aria-label={currentDoc.label}
              >
                <div className="flex h-full items-center justify-center p-4 text-center text-sm text-ukraine-blue-400">
                  <a
                    href={currentDoc.url}
                    download
                    className="text-ukraine-blue-600 underline hover:text-ukraine-blue-700"
                  >
                    {labels.download}
                  </a>
                </div>
              </object>
            ) : (
              <ExcelPreview url={currentDoc.url} errorMessage={labels.loadError} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
