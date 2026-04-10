'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyIbanButtonProps {
  iban: string;
  ariaLabel: string;
}

export default function CopyIbanButton({ iban, ariaLabel }: CopyIbanButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyIban = useCallback(() => {
    navigator.clipboard.writeText(iban).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      /* 剪贴板 API 不可用（如 HTTP 或浏览器限制） */
    });
  }, [iban]);

  return (
    <button
      onClick={copyIban}
      className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center
                 text-white/50 hover:bg-white/[0.15] hover:text-white
                 active:scale-90 transition-all duration-150 cursor-pointer"
      aria-label={ariaLabel}
    >
      {copied
        ? <Check className="w-4 h-4 text-life-500" />
        : <Copy className="w-4 h-4" />}
    </button>
  );
}
