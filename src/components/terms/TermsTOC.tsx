'use client';

import { useEffect, useState } from 'react';

type TocItem = {
  id: string;
  number: string;
  title: string;
};

type Props = {
  items: TocItem[];
  label: string;
};

/**
 * 粘性目录 — IntersectionObserver 高亮当前可见小节
 * 用于条款 / 隐私 / 公约等长文档页面
 */
export default function TermsTOC({ items, label }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );

    const elements = items
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
  };

  return (
    <nav aria-label={label} className="sticky top-24">
      <p className="mb-5 font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.25em] text-ukraine-blue-400">
        {label}
      </p>
      <ul className="space-y-px">
        {items.map(({ id, number, title }) => {
          const isActive = activeId === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
                className={`group relative flex items-baseline gap-3 border-l py-2.5 pl-5 pr-3 transition-all duration-300 ${
                  isActive
                    ? 'border-ukraine-gold-500 text-ukraine-blue-800'
                    : 'border-ukraine-blue-100/80 text-gray-500 hover:border-ukraine-blue-300 hover:text-ukraine-blue-700'
                }`}
              >
                {/* 活跃指示点 */}
                <span
                  className={`absolute -left-[5px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'scale-100 bg-ukraine-gold-500 shadow-[0_0_0_3px_rgba(245,184,0,0.18)]'
                      : 'scale-0 bg-ukraine-blue-300'
                  }`}
                />
                <span
                  className={`font-[family-name:var(--font-data)] text-[11px] font-semibold tracking-wider transition-colors ${
                    isActive ? 'text-ukraine-gold-600' : 'text-ukraine-blue-300'
                  }`}
                >
                  {number}
                </span>
                <span
                  className={`text-[13px] leading-snug transition-all ${
                    isActive ? 'font-semibold' : 'font-normal'
                  }`}
                >
                  {title}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
