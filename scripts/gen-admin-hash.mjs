#!/usr/bin/env node
/**
 * 用法:
 *   node scripts/gen-admin-hash.mjs <password>          # 自动生成随机 salt + cookie secret
 *   node scripts/gen-admin-hash.mjs <password> <salt>   # 使用指定 salt（轮换密码但保留 salt 的场景）
 *
 * 输出 ADMIN_PASSWORD_HASH / ADMIN_PASSWORD_SALT / ADMIN_COOKIE_SECRET，供 .env.local / Vercel 环境变量使用。
 * 注意：
 *   - HASH 与 SALT 必须配对。改 salt 会让旧 hash 作废，必须同时更新两个变量。
 *   - ADMIN_COOKIE_SECRET 用于签 admin 会话 cookie (HMAC-SHA256)。
 *     这里每次脚本跑都会输出一个新的；首次部署时复制进去即可，之后不需要轮换。
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

// cookie 签名 secret：32 字节随机 base64url（~43 字符）
const cookieSecret = crypto.randomBytes(32).toString('base64url');

console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_PASSWORD_SALT=${salt}`);
console.log(`ADMIN_COOKIE_SECRET=${cookieSecret}`);
