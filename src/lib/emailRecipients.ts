// 收件人解析 —— client-safe（不带 'use server'），EmailPanel 在浏览器构建收件人列表时 import。
// 服务端单封 sendOneEmailAction 仍对单地址再校验做纵深防御，这里的解析只是 UX + 列表构建。
import { EMAIL_RE_BATCH as EMAIL_RE } from '@/lib/email';

export const MAX_RECIPIENTS = 50; // Resend 单次最多 50；逐封发送沿用同一上限

export function parseRecipients(
  raw: string
): { ok: true; list: string[] } | { ok: false; error: string } {
  // 只按换行分隔，避免邮箱地址内特殊字符（+、.）被误分割
  const parts = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return { ok: false, error: 'No recipients' };
  if (parts.length > MAX_RECIPIENTS) {
    return { ok: false, error: `Too many recipients (max ${MAX_RECIPIENTS})` };
  }

  const invalid = parts.find((e) => !EMAIL_RE.test(e) || e.length > 254);
  if (invalid) return { ok: false, error: `Invalid address: ${invalid}` };

  // 去重（大小写不敏感，保留首个出现的形式）
  const seen = new Set<string>();
  const list: string[] = [];
  for (const e of parts) {
    const key = e.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      list.push(e);
    }
  }

  return { ok: true, list };
}
