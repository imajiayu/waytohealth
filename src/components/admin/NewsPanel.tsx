'use client';

import { useState } from 'react';
import NewsList from './news/NewsList';
import NewsEditor from './news/NewsEditor';
import { type NewsItem } from '@/data/news';

type View =
  | { kind: 'dashboard' }
  | { kind: 'composing' }
  | { kind: 'editing'; item: NewsItem };

export default function NewsPanel() {
  const [view, setView] = useState<View>({ kind: 'dashboard' });

  const title =
    view.kind === 'dashboard' ? 'News' : view.kind === 'composing' ? 'New post' : 'Edit post';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {view.kind === 'dashboard' && (
          <button
            type="button"
            onClick={() => setView({ kind: 'composing' })}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New post
          </button>
        )}
      </div>

      {view.kind === 'dashboard' && (
        <NewsList onEdit={(item) => setView({ kind: 'editing', item })} />
      )}
      {view.kind === 'composing' && (
        <NewsEditor
          onDone={() => setView({ kind: 'dashboard' })}
          onCancel={() => setView({ kind: 'dashboard' })}
        />
      )}
      {view.kind === 'editing' && (
        <NewsEditor
          mode="edit"
          initialItem={view.item}
          onDone={() => setView({ kind: 'dashboard' })}
          onCancel={() => setView({ kind: 'dashboard' })}
        />
      )}
    </div>
  );
}
