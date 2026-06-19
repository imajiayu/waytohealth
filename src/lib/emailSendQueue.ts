// 客户端逐封发送编排 —— client-safe（在浏览器跑）。
// 固定大小 worker 池 + 全局节流 + 429 指数退避，不引第三方库。
// EmailPanel 只管 UI：传收件人列表 + 单封发送函数 + 进度回调，这里负责并发与重试。

export type RecipientStatus = 'queued' | 'sending' | 'sent' | 'failed';

export interface RecipientProgress {
  address: string;
  status: RecipientStatus;
  id?: string; // 成功时 Resend message id
  error?: string; // 失败原因
  attempts: number; // 已尝试次数（429 退避时增长）
}

export type SendOneFn = (
  addr: string
) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;

interface SendBatchOpts {
  concurrency?: number; // 并发 worker 数，默认 2（贴合 Resend ~2 req/s）
  minIntervalMs?: number; // 两次发送起点最小间隔，默认 500ms
  maxAttempts?: number; // 单封最多尝试次数（含首次），默认 4（首发 + 3 次退避重试）
  onUpdate: (snapshot: RecipientProgress[]) => void;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// 把 Resend 返回的错误文本判定为限流（429）—— SDK 不一定给结构化 code，只能匹配文本
function isRateLimit(error: string): boolean {
  return /\b429\b|rate.?limit|too many/i.test(error);
}

export async function sendBatch(
  recipients: string[],
  sendOne: SendOneFn,
  opts: SendBatchOpts
): Promise<{ sent: number; failed: number }> {
  const concurrency = Math.max(1, opts.concurrency ?? 2);
  const minIntervalMs = opts.minIntervalMs ?? 500;
  const maxAttempts = Math.max(1, opts.maxAttempts ?? 4);

  const progress: RecipientProgress[] = recipients.map((address) => ({
    address,
    status: 'queued',
    attempts: 0,
  }));

  // React 需要新的数组/对象引用才会重渲染：每次回调发一份浅拷贝
  const emit = () => opts.onUpdate(progress.map((p) => ({ ...p })));
  emit();

  // 全局节流：每次发送预约一个起始时隙，时隙间隔 ≥ minIntervalMs。
  // now → nextStart 的读改写之间没有 await，单线程下天然原子，并发 worker 不会抢占同一时隙。
  let nextStart = 0;
  async function acquireSlot(): Promise<void> {
    const now = Date.now();
    const start = Math.max(now, nextStart);
    nextStart = start + minIntervalMs;
    const wait = start - now;
    if (wait > 0) await sleep(wait);
  }

  async function processOne(index: number): Promise<void> {
    const item = progress[index];
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      item.status = 'sending';
      item.attempts = attempt;
      emit();

      await acquireSlot();
      const res = await sendOne(item.address);

      if (res.ok) {
        item.status = 'sent';
        item.id = res.id;
        item.error = undefined;
        emit();
        return;
      }

      const rateLimited = isRateLimit(res.error);
      if (!rateLimited || attempt === maxAttempts) {
        item.status = 'failed';
        item.error = rateLimited ? `rate limited, gave up: ${res.error}` : res.error;
        emit();
        return;
      }

      // 限流且仍有重试余量：指数退避（1s → 2s → 4s …）后重投，状态保持 sending
      item.error = res.error;
      emit();
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }

  // N 个 worker 抢同一个游标，跑干为止
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < progress.length) {
      const index = cursor++;
      await processOne(index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, progress.length) }, worker));

  const sent = progress.filter((p) => p.status === 'sent').length;
  const failed = progress.filter((p) => p.status === 'failed').length;
  return { sent, failed };
}
