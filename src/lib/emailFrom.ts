// 发件人配置常量 —— 不带 server-only，admin UI 也要读来渲染下拉
// display name 和域名都是项目常量，不是运行时配置

export const FROM_DISPLAY_NAME = 'Way to Health';
export const FROM_DOMAIN = 'waytohealth.org.ua';

// 前缀白名单：admin 发信时从下拉选择
export const FROM_PREFIXES = ['info', 'head', 'support', 'news', 'noreply', 'Ekaterina.Karpenko', 'Yaroslav.Tretiakov'] as const;
export type FromPrefix = (typeof FROM_PREFIXES)[number];
export const DEFAULT_FROM_PREFIX: FromPrefix = 'info';

// RFC 5321：本地部分字母数字开头，允许 . _ + -，最长 64 字符
export const PREFIX_RE = /^[a-zA-Z0-9][a-zA-Z0-9._+\-]{0,63}$/;

export function isFromPrefix(value: unknown): value is FromPrefix {
  return typeof value === 'string' && (FROM_PREFIXES as readonly string[]).includes(value);
}

export function isValidPrefixFormat(value: unknown): value is string {
  return typeof value === 'string' && PREFIX_RE.test(value);
}

export function buildFromAddress(prefix: string = DEFAULT_FROM_PREFIX): string {
  return `${FROM_DISPLAY_NAME} <${prefix}@${FROM_DOMAIN}>`;
}
