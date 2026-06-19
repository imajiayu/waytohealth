// 邮件附件共享类型 + 校验常量 —— client-safe（不带 server-only）。
// 前端 AttachmentPicker 累加大小 / 卡 MIME，服务端 sendOneEmailAction 用同一套常量纵深校验。

// 客户端选中并上传到 Blob 后回传的附件描述；发送时映射成 Resend 的 { filename, path: url, contentType }
export interface AttachmentInput {
  filename: string; // 原始文件名（带扩展名）
  url: string; // email-attachments/ 下的 Blob 公开 URL
  contentType: string;
  size: number; // 字节
}

// Resend 单封邮件附件总上限 40MB —— 客户端累加超过即警告并禁用发送
export const EMAIL_ATTACH_MAX_TOTAL_BYTES = 40 * 1024 * 1024;
// 单文件上限 25MB —— upload 路由服务端硬限制 + 前端提示
export const EMAIL_ATTACH_MAX_FILE_BYTES = 25 * 1024 * 1024;

// 允许的附件 MIME 白名单：常见文档 / 图片 / 压缩包；upload 路由和发送 action 共用
export const EMAIL_ATTACH_ALLOWED_MIME: string[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip',
  'text/plain',
  'text/csv',
];

// HTML accept 属性（文件选择器过滤；不是安全边界，真正护栏在 upload 路由的 MIME 白名单）
export const EMAIL_ATTACH_ACCEPT = EMAIL_ATTACH_ALLOWED_MIME.join(',');
