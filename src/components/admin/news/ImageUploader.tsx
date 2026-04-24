'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { type ImageDraft, MAX_IMAGES_HARD } from './types';

interface ImageUploaderProps {
  images: ImageDraft[];
  onFilesSelected: (files: FileList | null) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

// 本地图片选择 + 缩略图网格（不负责上传，上传在提交时由父统一处理）
export default function ImageUploader({
  images,
  onFilesSelected,
  onRemove,
  disabled,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const labelCls = 'block text-sm font-medium text-gray-700';

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className={labelCls}>
          Images <span className="text-xs font-normal text-gray-400">(uploaded when you publish · front-end shows up to 9 with +N)</span>
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || images.length >= MAX_IMAGES_HARD}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 disabled:opacity-50"
        >
          + Add images
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={(e) => {
          onFilesSelected(e.target.files);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        className="hidden"
      />
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((img, i) => {
            const src = img.kind === 'existing' ? img.url : img.previewUrl;
            const alt = img.kind === 'existing' ? `image ${i + 1}` : img.name;
            return (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded border border-gray-200 bg-gray-50">
                <Image src={src} alt={alt} fill sizes="20vw" unoptimized className="object-cover" />
                <div className="pointer-events-none absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {i + 1}
                </div>
                {img.kind === 'new' && (
                  <div className="pointer-events-none absolute left-1 bottom-1 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    new
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(img.id)}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"
                >
                  remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
