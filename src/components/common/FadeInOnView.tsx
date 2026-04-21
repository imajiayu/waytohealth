'use client';

import { type ReactNode } from 'react';
import { useInViewOnce } from '@/hooks/useInViewOnce';

interface FadeInOnViewProps {
  children: ReactNode;
  delayIndex?: number;
  animationName?: string;
  className?: string;
}

// 最小 client 包裹：只负责"进入视口后播放一次入场动画"，让父组件本身可保持 SC
export default function FadeInOnView({
  children,
  delayIndex = 0,
  animationName = 'projectCardIn',
  className = '',
}: FadeInOnViewProps) {
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-2 ${className}`.trim()}
      style={{
        animation: isVisible
          ? `${animationName} 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(delayIndex, 5) * 0.06}s forwards`
          : 'none',
      }}
    >
      {children}
    </div>
  );
}
