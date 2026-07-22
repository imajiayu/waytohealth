'use client';

import { track } from '@/lib/fbpixel';

interface ContactLinkProps {
  href: string;
  channel: 'email' | 'phone';
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

// mailto/tel 链接的通用封装：点击时上报 Meta Pixel 的 Contact 事件（规格要求）。
// Footer / MobileMenuPanel / ContactCards 共用，样式经 className 透传，保持各处外观不变。
export default function ContactLink({
  href,
  channel,
  className,
  ariaLabel,
  children,
}: ContactLinkProps) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={className}
      onClick={() => track('Contact', { channel })}
    >
      {children}
    </a>
  );
}
