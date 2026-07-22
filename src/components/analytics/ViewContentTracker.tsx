'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/fbpixel';

// Meta Pixel ViewContent：每进入一个项目详情上报一次（规格要求）。
// projectId 由 server 组件按 ?id= 传入 —— 同一路由 /projects 下软导航切到另一个项目时，
// query 变、pathname 不变、组件被 React 复用（不重新 mount），此时靠 projectId 依赖变化补发，
// 避免漏计。不用 useSearchParams（后者触发 CSR bailout，破坏 layout 静态渲染）。
// lastFired ref 记住已打过的 id：防 StrictMode 双调用 / 同 id 重渲染重复打点。
export default function ViewContentTracker({ projectId }: { projectId: number }) {
  const lastFired = useRef<number | null>(null);
  useEffect(() => {
    if (lastFired.current === projectId) return;
    lastFired.current = projectId;
    track('ViewContent', { content_ids: [String(projectId)] });
  }, [projectId]);
  return null;
}
