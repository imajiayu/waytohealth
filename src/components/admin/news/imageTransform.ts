// 客户端图片转码：resize 到最长边 ≤ 2400，转成 webp 质量 0.85。HEIC/HEIF 直接拒绝
// （Chrome/Firefox 没有 HEIC decoder，浏览器侧无法转码；要求用户改格式后再传）

const MAX_EDGE = 2400;
const QUALITY = 0.85;

const HEIC_MIME = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);
const HEIC_EXT = /\.(heic|heif)$/i;

export function isHeic(file: File): boolean {
  return HEIC_MIME.has(file.type.toLowerCase()) || HEIC_EXT.test(file.name);
}

function replaceExt(name: string, ext: string): string {
  return name.replace(/\.[^./\\]+$/, '') + ext;
}

export async function transcodeToWebp(file: File): Promise<File> {
  if (isHeic(file)) {
    throw new Error('HEIC/HEIF not supported — convert to JPEG/PNG/WebP first');
  }

  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context unavailable');
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', QUALITY),
    );
    if (!blob) throw new Error('webp encode failed (browser may not support webp output)');

    return new File([blob], replaceExt(file.name, '.webp'), {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close?.();
  }
}
