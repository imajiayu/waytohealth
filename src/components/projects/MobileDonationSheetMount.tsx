'use client';

import { useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';

// MobileDonationSheet 只在 lg 以下出现；用媒体查询 + dynamic(ssr:false) 让桌面端跳过 JS
const MobileDonationSheet = dynamic(() => import('./MobileDonationSheet'), { ssr: false });

interface MobileDonationSheetMountProps {
  goalAmount: number | null;
  raisedAmount: number;
  projectTitle: string;
  monobankJarSendId?: string;
  eurRate: number | null;
}

const MQ = '(max-width: 1023.98px)'; // Tailwind lg 断点以下

// useSyncExternalStore：订阅 matchMedia 变化，避免 useEffect + setState 级联渲染警告
function subscribe(callback: () => void) {
  const mql = window.matchMedia(MQ);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}
function getSnapshot(): boolean {
  return window.matchMedia(MQ).matches;
}
function getServerSnapshot(): boolean {
  return false; // SSR 默认桌面，hydrate 后再纠正
}

export default function MobileDonationSheetMount(props: MobileDonationSheetMountProps) {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!isMobile) return null;
  return <MobileDonationSheet {...props} />;
}
