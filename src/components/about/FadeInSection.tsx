'use client';

import { useInViewOnce } from '@/hooks/useInViewOnce';

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

/**
 * 滚动入场动画包装 — 元素进入视口时触发淡入上滑
 */
export default function FadeInSection({ children, className = '', delay = 0 }: Props) {
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
