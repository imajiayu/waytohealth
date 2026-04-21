#!/usr/bin/env node
/**
 * 用法:
 *   node scripts/gen-admin-hash.mjs <password>          # 自动生成随机 salt
 *   node scripts/gen-admin-hash.mjs <password> <salt>   # 使用指定 salt（轮换密码但保留 salt 的场景）
 *
 * 输出 ADMIN_PASSWORD_HASH 与 ADMIN_PASSWORD_SALT，供 .env.local / Vercel 环境变量使用。
 * 注意：HASH 与 SALT 必须配对。改 salt 会让旧 hash 作废，必须同时更新两个变量。
 */
import crypto from 'node:crypto';

const [, , pw, saltArg] = process.argv;
if (!pw) {
  console.error('Usage: node scripts/gen-admin-hash.mjs <password> [salt]');
  process.exit(1);
}

// 未提供 salt 时生成 24 字节 base64url 随机串（避免已进 git 的弱默认值）
const salt = saltArg ?? crypto.randomBytes(24).toString('base64url');
const hash = crypto.createHash('sha256').update(pw + salt).digest('hex');

console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_PASSWORD_SALT=${salt}`);
