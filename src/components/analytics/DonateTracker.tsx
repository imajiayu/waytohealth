'use client';

import { useEffect } from 'react';
import { track } from '@/lib/fbpixel';

// Meta Pixel Donate：Stripe 付款完成后跳回本成功页时上报一次（规格要求）。
// Stripe 回跳会带 ?session_id=...，按其在 sessionStorage 去重，防刷新重复计数。
// 直接读 window.location.search（不走 useSearchParams），避免 CSR bailout。
export default function DonateTracker() {
  useEffect(() => {
    const sid =
      new URLSearchParams(window.location.search).get('session_id') ?? 'no-session';
    const key = `wth_donate_fired_${sid}`;
    try {
      if (sessionStorage.getItem(key)) return; // 本会话已打过 → 跳过
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage 不可用（隐私模式）：不去重，照常打点
    }
    track('Donate');
  }, []);
  return null;
}
