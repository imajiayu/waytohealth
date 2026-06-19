import 'server-only';
import { list } from '@vercel/blob';
import { unstable_cache } from 'next/cache';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

// 邮件模板存储：一个模板 = Blob 文件夹 email-templates/<slug>/，含
//   - meta.json   元数据（固定 key，server 端写，cacheControlMaxAge:0）
//   - body.html   正文 HTML（admin 上传，带随机后缀）
//   - body.txt    可选纯文本 fallback
//   - 任意图片资源
// 列表 = list({prefix}) 扫出各 slug 的 meta.json；渲染 = 读 meta + fetch html/text。
// 取代旧的编译期 TEMPLATES 常量注册表。

export type EmailLocale = 'ua' | 'en';

export const TEMPLATE_PREFIX = 'email-templates/';
export const TEMPLATE_CACHE_TAG = 'email-templates';

// 运行时模板对象。注意：slug 不存进 meta.json —— 它是 Blob 路径 email-templates/<slug>/ 本身，
// 读取时由 toTemplateMeta 从路径派生填充。meta.json 实际只持久化 slug 以外的字段。
export interface TemplateMeta {
  slug: string; // 由 blob 路径派生，非持久化字段
  name: string;
  locales: EmailLocale[];
  subject: string; // 默认主题
  htmlUrl: string; // 正文 .html 的 Blob 公开 URL
  textUrl?: string; // 可选纯文本 fallback 的 Blob URL
  assetUrls?: string[]; // 上传的图片/资源 URL（审计 / 删除用）
  updatedAt: string; // ISO
}

// 给 UI 列表用（id = slug，沿用旧字段名以最小化 EmailPanel 改动）
export interface EmailTemplateMeta {
  id: string;
  name: string;
  locales: EmailLocale[];
  subject: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function isLocale(v: unknown): v is EmailLocale {
  return v === 'ua' || v === 'en';
}

// 把 fetch 回来的 unknown JSON 收窄成 TemplateMeta；字段缺失 / 类型不对则返回 null（跳过该模板）
function toTemplateMeta(raw: unknown, slug: string): TemplateMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== 'string' || typeof o.subject !== 'string') return null;
  if (typeof o.htmlUrl !== 'string') return null;
  const locales = Array.isArray(o.locales) ? o.locales.filter(isLocale) : [];
  return {
    slug,
    name: o.name,
    locales,
    subject: o.subject,
    htmlUrl: o.htmlUrl,
    textUrl: typeof o.textUrl === 'string' ? o.textUrl : undefined,
    assetUrls: Array.isArray(o.assetUrls) ? o.assetUrls.filter((u): u is string => typeof u === 'string') : undefined,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : '',
  };
}

// 从 pathname `email-templates/<slug>/meta.json` 取 slug
function slugFromMetaPath(pathname: string): string | null {
  const rest = pathname.slice(TEMPLATE_PREFIX.length); // `<slug>/meta.json`
  const i = rest.indexOf('/');
  if (i <= 0) return null;
  if (rest.slice(i + 1) !== 'meta.json') return null;
  return rest.slice(0, i);
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetchWithTimeout(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`blob fetch ${res.status}`);
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetchWithTimeout(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`blob fetch ${res.status}`);
  return res.text();
}

// 扫出所有模板的 meta.json（带 cursor 分页兜底），解析成 TemplateMeta[]
async function loadAllMetas(): Promise<TemplateMeta[]> {
  const metaBlobs: { url: string; slug: string }[] = [];
  let cursor: string | undefined;
  do {
    const { blobs, cursor: next, hasMore } = await list({ prefix: TEMPLATE_PREFIX, cursor });
    for (const b of blobs) {
      const slug = slugFromMetaPath(b.pathname);
      if (slug) metaBlobs.push({ url: b.url, slug });
    }
    cursor = hasMore ? next : undefined;
  } while (cursor);

  // fetch 错误（Blob 抖动 / 网络）让其冒泡 —— Promise.all 整体 reject → _listTemplates 抛错 →
  // 外层 listTemplates 的 try/catch 接住返回 []，但因抛错 unstable_cache 不缓存该空态（兑现下方注释承诺）。
  // 仅当 JSON 合法但字段不合法（toTemplateMeta 返回 null）时跳过该模板：单个坏数据不拖垮整张列表。
  const metas = await Promise.all(
    metaBlobs.map(async ({ url, slug }) => toTemplateMeta(await fetchJson(url), slug))
  );
  return metas.filter((m): m is TemplateMeta => m !== null);
}

// 跨请求缓存 60s；模板 CRUD 后 revalidateTag(TEMPLATE_CACHE_TAG) 主动失效。
// try/catch 放在 unstable_cache 外层 —— 内部抛错时 Next.js 不缓存该次结果，
// 避免 DB/Blob 抖动时空列表被缓存 60s（参考 src/lib/news.ts 同款经验）。
const _listTemplates = unstable_cache(
  async (): Promise<EmailTemplateMeta[]> => {
    const metas = await loadAllMetas();
    metas.sort((a, b) => a.name.localeCompare(b.name));
    return metas.map((m) => ({
      id: m.slug,
      name: m.name,
      locales: m.locales,
      subject: m.subject,
    }));
  },
  ['email-templates-all'],
  { revalidate: 60, tags: [TEMPLATE_CACHE_TAG] }
);

export async function listTemplates(): Promise<EmailTemplateMeta[]> {
  try {
    return await _listTemplates();
  } catch (err) {
    console.error('[emailTemplates:list]', err);
    return [];
  }
}

// 按 slug 前缀扫该文件夹找 meta.json 并解析
async function findMeta(slug: string): Promise<TemplateMeta | null> {
  const { blobs } = await list({ prefix: `${TEMPLATE_PREFIX}${slug}/` });
  const metaBlob = blobs.find((b) => b.pathname === `${TEMPLATE_PREFIX}${slug}/meta.json`);
  if (!metaBlob) return null;
  return toTemplateMeta(await fetchJson(metaBlob.url), slug);
}

// 取单个模板的完整 meta（含 htmlUrl/textUrl/assetUrls）—— 编辑回填用，不缓存（要拿最新）
export async function getTemplateMeta(slug: string): Promise<TemplateMeta | null> {
  try {
    return await findMeta(slug);
  } catch (err) {
    console.error('[emailTemplates:getMeta]', err);
    return null;
  }
}

const _renderEmail = unstable_cache(
  async (slug: string): Promise<RenderedEmail | null> => {
    const meta = await findMeta(slug);
    if (!meta) return null;
    const html = await fetchText(meta.htmlUrl);
    const text = meta.textUrl ? await fetchText(meta.textUrl) : '';
    return { subject: meta.subject, html, text };
  },
  ['email-template-render'],
  { revalidate: 60, tags: [TEMPLATE_CACHE_TAG] }
);

export async function renderEmail(
  slug: string
): Promise<{ ok: true; rendered: RenderedEmail } | { ok: false; error: string }> {
  try {
    const rendered = await _renderEmail(slug);
    if (!rendered) return { ok: false, error: 'unknown template' };
    return { ok: true, rendered };
  } catch (err) {
    console.error('[emailTemplates:render]', err);
    return { ok: false, error: err instanceof Error ? err.message : 'render failed' };
  }
}
