import 'server-only';

/**
 * fetch + AbortSignal.timeout —— 给外部 API 调用加超时，避免悬挂请求阻塞整条 server action / ISR 重建。
 *
 * 用法：替换所有对外部服务（github, NBU, ...）的裸 fetch。
 *
 * @param input  URL 或 Request
 * @param init   普通 fetch init
 * @param timeoutMs  超时毫秒数，默认 8000
 */
export async function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  // 若调用方自己传了 signal，保留它并与 timeout 信号合并
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(input, { ...init, signal });
}
