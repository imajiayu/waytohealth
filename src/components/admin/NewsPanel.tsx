'use client';

import { useState } from 'react';
import NewsList from './news/NewsList';
import NewsEditor from './news/NewsEditor';

type View = 'dashboard' | 'composing';

export default function NewsPanel() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {view === 'dashboard' ? 'News' : 'New post'}
        </h1>
        {view === 'dashboard' && (
          <button
            type="button"
            onClick={() => setView('composing')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New post
          </button>
        )}
      </div>

      {view === 'dashboard' && <NewsList />}
      {view === 'composing' && (
        <NewsEditor onDone={() => setView('dashboard')} onCancel={() => setView('dashboard')} />
      )}
    </div>
  );
}
