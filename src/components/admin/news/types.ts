// 编辑器里的图片草稿：可能是已发布的 Blob URL（existing），也可能是刚选的本地文件（new）
export type ImageDraft =
  | {
      kind: 'existing';
      id: string;
      url: string;       // 已上传的 Blob URL，发布时直接复用
    }
  | {
      kind: 'new';
      id: string;
      name: string;
      file: File;        // 原始文件，发布时才上传到 Blob
      previewUrl: string; // URL.createObjectURL(file) — 本地预览
    };

export const MAX_IMAGES_HARD = 30;
