'use client';

import { useState, type KeyboardEvent } from 'react';
import { type Tag } from '@/data/news';

export const MAX_TAGS_PER_POST = 6;
export const MAX_TAG_LENGTH = 30;

interface TagInputProps {
  value: Tag[];
  onChange: (next: Tag[]) => void;
  disabled?: boolean;
}

const inputCls =
  'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400';
const labelCls = 'block text-sm font-medium text-gray-700';

export default function TagInput({ value, onChange, disabled = false }: TagInputProps) {
  const [draftUa, setDraftUa] = useState('');
  const [draftEn, setDraftEn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const uaId = 'tag-input-ua';
  const enId = 'tag-input-en';

  const reachedLimit = value.length >= MAX_TAGS_PER_POST;
  const inputsDisabled = disabled || reachedLimit;

  function tryAdd() {
    setError(null);
    const ua = draftUa.trim().slice(0, MAX_TAG_LENGTH);
    const en = draftEn.trim().slice(0, MAX_TAG_LENGTH);
    if (!ua || !en) {
      setError('Both UA and EN are required.');
      return;
    }
    if (reachedLimit) {
      setError(`Max ${MAX_TAGS_PER_POST} tags.`);
      return;
    }
    const key = en.toLowerCase();
    if (value.some((t) => t.en.toLowerCase() === key)) {
      setError('Tag already added.');
      return;
    }
    onChange([...value, { ua, en }]);
    setDraftUa('');
    setDraftEn('');
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
    setError(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      tryAdd();
    }
  }

  return (
    <div>
      <span className={labelCls}>Tags</span>
      <p className="mt-0.5 text-[11px] text-gray-500">
        Bilingual topic labels. Max {MAX_TAGS_PER_POST} per post. EN is used as the filter key.
      </p>

      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          id={uaId}
          aria-label="Tag (UA)"
          type="text"
          value={draftUa}
          onChange={(e) => setDraftUa(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tag (UA)"
          maxLength={MAX_TAG_LENGTH}
          disabled={inputsDisabled}
          className={inputCls}
        />
        <input
          id={enId}
          aria-label="Tag (EN)"
          type="text"
          value={draftEn}
          onChange={(e) => setDraftEn(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tag (EN)"
          maxLength={MAX_TAG_LENGTH}
          disabled={inputsDisabled}
          className={inputCls}
        />
        <button
          type="button"
          onClick={tryAdd}
          disabled={inputsDisabled}
          className="mt-1 self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 sm:mt-1"
        >
          Add
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {reachedLimit && !error && (
        <p className="mt-2 text-xs text-amber-600">Max {MAX_TAGS_PER_POST} tags reached.</p>
      )}

      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map((tag, i) => (
            <li
              key={`${tag.en}-${i}`}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-3 pr-1.5 text-xs"
            >
              <span className="font-medium text-gray-700">{tag.ua}</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600">{tag.en}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label={`Remove ${tag.en}`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
