'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import {
  type AttachmentInput,
  EMAIL_ATTACH_ACCEPT,
  EMAIL_ATTACH_ALLOWED_MIME,
  EMAIL_ATTACH_MAX_FILE_BYTES,
  EMAIL_ATTACH_MAX_TOTAL_BYTES,
} from '@/lib/emailAttachments';
import { formatBytes } from '../emailFormat';
import AlertBanner from '../common/AlertBanner';

interface AttachmentPickerProps {
  attachments: AttachmentInput[];
  onChange: (next: AttachmentInput[]) => void;
  disabled?: boolean;
}

// 附件选择 + 直传 Blob（email-attachments/，不转码保留原始格式）。
// 发送时父组件把每个附件的 Blob URL 作为 Resend path 传出。
export default function AttachmentPicker({ attachments, onChange, disabled }: AttachmentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBytes = attachments.reduce((sum, a) => sum + a.size, 0);
  const overTotal = totalBytes > EMAIL_ATTACH_MAX_TOTAL_BYTES;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const errors: string[] = [];
    const added: AttachmentInput[] = [];

    for (const file of Array.from(files)) {
      // 客户端预校验（真正护栏在 upload 路由）：给即时反馈
      if (file.size > EMAIL_ATTACH_MAX_FILE_BYTES) {
        errors.push(`${file.name}: too large (max ${formatBytes(EMAIL_ATTACH_MAX_FILE_BYTES)})`);
        continue;
      }
      if (!EMAIL_ATTACH_ALLOWED_MIME.includes(file.type)) {
        errors.push(`${file.name}: type not allowed (${file.type || 'unknown'})`);
        continue;
      }
      try {
        const blob = await upload(`email-attachments/${file.name}`, file, {
          access: 'public',
          handleUploadUrl: '/api/email/upload',
          contentType: file.type,
        });
        added.push({ filename: file.name, url: blob.url, contentType: file.type, size: file.size });
      } catch {
        errors.push(`${file.name}: upload failed`);
      }
    }

    if (added.length > 0) onChange([...attachments, ...added]);
    if (errors.length > 0) setError(errors.join(' · '));
    setUploading(false);
  }

  function remove(url: string) {
    onChange(attachments.filter((a) => a.url !== url));
  }

  const labelCls = 'block text-sm font-medium text-gray-700';

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className={labelCls}>
          Attachments <span className="text-xs font-normal text-gray-400">(optional · max {formatBytes(EMAIL_ATTACH_MAX_FILE_BYTES)} per file)</span>
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : '+ Add files'}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        aria-label="Add attachments"
        multiple
        accept={EMAIL_ATTACH_ACCEPT}
        onChange={(e) => {
          void handleFiles(e.target.files);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        className="hidden"
      />

      {error && (
        <div className="mt-2">
          <AlertBanner variant="error">{error}</AlertBanner>
        </div>
      )}

      {attachments.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {attachments.map((a) => (
            <li
              key={a.url}
              className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-gray-800" title={a.filename}>
                {a.filename}
              </span>
              <span className="shrink-0 font-mono text-xs text-gray-500">{formatBytes(a.size)}</span>
              <button
                type="button"
                onClick={() => remove(a.url)}
                className="shrink-0 text-xs text-red-600 hover:text-red-700"
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {attachments.length > 0 && (
        <p className={`mt-2 text-xs ${overTotal ? 'font-medium text-red-600' : 'text-gray-400'}`}>
          Total {formatBytes(totalBytes)}
          {overTotal && ` · exceeds ${formatBytes(EMAIL_ATTACH_MAX_TOTAL_BYTES)} per-email limit — remove some files`}
        </p>
      )}
    </div>
  );
}
