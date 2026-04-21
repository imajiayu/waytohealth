export interface ImageDraft {
  id: string;
  name: string;
  file: File;         // 原始文件，发布时才上传到 Blob
  previewUrl: string; // URL.createObjectURL(file) — 本地预览
}

export const MAX_IMAGES_HARD = 30;
