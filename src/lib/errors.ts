// 取 Error.message 或回落到 fallback；最小职责，不打 log、不做 stack trace、不上报。
// 仅用于 server action 把异常压成 `{ ok: false, error: string }` 的 result。
export function errorMessage(err: unknown, fallback = 'unknown error'): string {
  return err instanceof Error ? err.message : fallback;
}
