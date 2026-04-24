// 发件人配置常量 —— 不带 server-only，admin UI 也要读来渲染下拉
// display name 和域名都是项目常量，不是运行时配置

export const FROM_DISPLAY_NAME = 'Way to Health';
export const FROM_DOMAIN = 'waytohealth.org.ua';

// 前缀白名单：admin 发信时从下拉选择，避免被当成开放转发器
export const FROM_PREFIXES = ['info', 'support', 'news', 'noreply'] as const;
export type FromPrefix = (typeof FROM_PREFIXES)[number];
export const DEFAULT_FROM_PREFIX: FromPrefix = 'noreply';

export function isFromPrefix(value: unknown): value is FromPrefix {
  return typeof value === 'string' && (FROM_PREFIXES as readonly string[]).includes(value);
}

export function buildFromAddress(prefix: FromPrefix = DEFAULT_FROM_PREFIX): string {
  return `${FROM_DISPLAY_NAME} <${prefix}@${FROM_DOMAIN}>`;
}
