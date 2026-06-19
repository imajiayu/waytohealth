'use client';

import { useState } from 'react';
import EmailPanel from '../EmailPanel';
import TemplateManager from './TemplateManager';

type Tab = 'send' | 'templates';

// Email 后台的两个子视图：发送（EmailPanel）+ 模板管理（TemplateManager），顶部 segmented control 切换。
// 切换会重挂对应组件 —— 从 Templates 改完回 Send 时 EmailPanel 重新拉模板列表，自然拿到最新。
export default function EmailWorkspace() {
  const [tab, setTab] = useState<Tab>('send');

  return (
    <div>
      <div
        role="tablist"
        aria-label="Email sections"
        className="mb-6 inline-flex rounded-md border border-gray-300 bg-gray-50 p-0.5 text-sm"
      >
        {(
          [
            ['send', 'Send'],
            ['templates', 'Templates'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded px-4 py-1.5 transition-colors ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'send' ? <EmailPanel /> : <TemplateManager />}
    </div>
  );
}
