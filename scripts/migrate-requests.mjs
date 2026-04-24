#!/usr/bin/env node
/**
 * 一次性迁移：为前台表单系统建表。
 * 幂等（IF NOT EXISTS），重跑无副作用。
 *
 * Usage:
 *   node scripts/migrate-requests.mjs
 */
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

function loadEnvLocal() {
  try {
    const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
    for (const line of raw.split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  } catch {
    // .env.local 可选
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const sql = neon(url);

  console.log('[migrate] creating assistance_requests…');
  await sql`
    CREATE TABLE IF NOT EXISTS assistance_requests (
      id           TEXT PRIMARY KEY,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      locale       TEXT NOT NULL,
      data         JSONB NOT NULL
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_assistance_submitted
      ON assistance_requests (submitted_at DESC)
  `;

  console.log('[migrate] creating partnership_requests…');
  await sql`
    CREATE TABLE IF NOT EXISTS partnership_requests (
      id           TEXT PRIMARY KEY,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      locale       TEXT NOT NULL,
      data         JSONB NOT NULL
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_partnership_submitted
      ON partnership_requests (submitted_at DESC)
  `;

  const aCount = await sql`SELECT COUNT(*)::int AS n FROM assistance_requests`;
  const pCount = await sql`SELECT COUNT(*)::int AS n FROM partnership_requests`;
  console.log('[migrate] done.');
  console.log(`  assistance_requests : ${aCount[0].n} rows`);
  console.log(`  partnership_requests: ${pCount[0].n} rows`);
}

main().catch((err) => {
  console.error('[migrate] failed:', err.message ?? err);
  process.exit(1);
});
