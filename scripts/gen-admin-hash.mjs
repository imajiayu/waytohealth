#!/usr/bin/env node
/**
 * 用法: node scripts/gen-admin-hash.mjs <password> [salt]
 * 输出 ADMIN_PASSWORD_HASH 与 ADMIN_PASSWORD_SALT，供 .env.local / Vercel 环境变量使用。
 */
import crypto from 'node:crypto';

const [, , pw, saltArg] = process.argv;
if (!pw) {
  console.error('Usage: node scripts/gen-admin-hash.mjs <password> [salt]');
  process.exit(1);
}
const salt = saltArg ?? 'wth-news-2026';
const hash = crypto.createHash('sha256').update(pw + salt).digest('hex');

console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_PASSWORD_SALT=${salt}`);
