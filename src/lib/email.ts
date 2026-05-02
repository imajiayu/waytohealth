// 单地址校验：用于表单字段、入站邮件 reply-to 等只接收一个邮箱的场景
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 批量发送场景：额外禁止 ,; 防止用户在单地址输入框误拼多个；
// `parseRecipients` 已按换行拆分，再禁掉这两个字符是对误输入的额外防御
export const EMAIL_RE_BATCH = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
