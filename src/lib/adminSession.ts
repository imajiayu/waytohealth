import 'server-only';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Admin 会话：HMAC-SHA256 签名的 HttpOnly cookie，不依赖任何会话存储。
 *
 * Cookie 值结构：`<base64url(payload)>.<base64url(sig)>`
 *   - payload: JSON { iat, exp, v }
 *   - sig: HMAC-SHA256(ADMIN_COOKIE_SECRET, payloadBase64)
 *
 * 验证：恢复 payload，timingSafeEqual 比对签名，检查 exp > now。
 *
 * 所有 admin server action / API route 通过 `requireAdmin()` 拒绝未鉴权请求。
 */

const COOKIE_NAME = 'wth_admin';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 小时
const SESSION_VERSION = 1;

function b64urlEncode(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString('base64url');
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

function getSecret(): string {
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_COOKIE_SECRET env var is required (>= 32 chars)');
  }
  return secret;
}

interface SessionPayload {
  iat: number; // issued at (epoch seconds)
  exp: number; // expire at (epoch seconds)
  v: number;   // version
  jti: string; // unique id (防重放用，此处仅留接口)
}

function sign(payloadB64: string): string {
  const sig = createHmac('sha256', getSecret()).update(payloadB64).digest();
  return b64urlEncode(sig);
}

function buildToken(payload: SessionPayload): string {
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload), 'utf-8'));
  const sigB64 = sign(payloadB64);
  return `${payloadB64}.${sigB64}`;
}

function parseToken(token: string): SessionPayload | null {
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  const expected = sign(payloadB64);
  const a = b64urlDecode(sigB64);
  const b = b64urlDecode(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  try {
    const raw = b64urlDecode(payloadB64).toString('utf-8');
    const parsed = JSON.parse(raw) as Partial<SessionPayload>;
    if (typeof parsed.iat !== 'number') return null;
    if (typeof parsed.exp !== 'number') return null;
    if (parsed.v !== SESSION_VERSION) return null;
    if (typeof parsed.jti !== 'string') return null;
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

/** 发放新 session cookie（login 成功后调用）。 */
export async function issueSession(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    v: SESSION_VERSION,
    jti: b64urlEncode(randomBytes(16)),
  };
  const token = buildToken(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** 清除 session cookie（logout）。 */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

/** 读 cookie 并校验签名 + 过期；有效返回 payload，否则返回 null。 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const parsed = parseToken(raw);
  if (!parsed) return null;
  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp < now) return null;
  return parsed;
}

/** 所有 admin mutation 入口调一次；未鉴权直接 throw。 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('unauthorized');
  }
  return session;
}
