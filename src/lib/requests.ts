import 'server-only';
import { sql } from '@/lib/db';
import { randomSuffix } from '@/lib/ids';
import type {
  AssistanceRequestData,
  AssistanceRequestRecord,
  PartnershipRequestData,
  PartnershipRequestRecord,
} from '@/data/requests';

/**
 * 前台表单提交存储 + admin 侧读取。
 *
 * Schema（需在 Neon console 一次性执行）：
 *
 *   CREATE TABLE assistance_requests (
 *     id           TEXT PRIMARY KEY,
 *     submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     locale       TEXT NOT NULL,
 *     data         JSONB NOT NULL
 *   );
 *   CREATE INDEX idx_assistance_submitted ON assistance_requests (submitted_at DESC);
 *
 *   CREATE TABLE partnership_requests (
 *     id           TEXT PRIMARY KEY,
 *     submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     locale       TEXT NOT NULL,
 *     data         JSONB NOT NULL
 *   );
 *   CREATE INDEX idx_partnership_submitted ON partnership_requests (submitted_at DESC);
 */

function makeRequestId(prefix: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const timeStr = `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
  return `${prefix}-${dateStr}-${timeStr}-${randomSuffix()}`;
}

/* ── Assistance ──────────────────────────────────────────────────────── */

interface AssistanceRow {
  id: string;
  submitted_at: Date;
  locale: string;
  data: AssistanceRequestData;
}

function assistanceRowToRecord(r: AssistanceRow): AssistanceRequestRecord {
  return {
    id: r.id,
    submitted_at: r.submitted_at.toISOString(),
    locale: r.locale === 'en' ? 'en' : 'ua',
    data: r.data,
  };
}

export async function insertAssistanceRequest(params: {
  locale: 'ua' | 'en';
  data: AssistanceRequestData;
}): Promise<string> {
  const id = makeRequestId('ar');
  await sql`
    INSERT INTO assistance_requests (id, locale, data)
    VALUES (${id}, ${params.locale}, ${JSON.stringify(params.data)}::jsonb)
  `;
  return id;
}

export async function listAssistanceRequests(): Promise<AssistanceRequestRecord[]> {
  const rows = (await sql`
    SELECT id, submitted_at, locale, data
    FROM assistance_requests
    ORDER BY submitted_at DESC
  `) as AssistanceRow[];
  return rows.map(assistanceRowToRecord);
}

/* ── Partnership ─────────────────────────────────────────────────────── */

interface PartnershipRow {
  id: string;
  submitted_at: Date;
  locale: string;
  data: PartnershipRequestData;
}

function partnershipRowToRecord(r: PartnershipRow): PartnershipRequestRecord {
  return {
    id: r.id,
    submitted_at: r.submitted_at.toISOString(),
    locale: r.locale === 'en' ? 'en' : 'ua',
    data: r.data,
  };
}

export async function insertPartnershipRequest(params: {
  locale: 'ua' | 'en';
  data: PartnershipRequestData;
}): Promise<string> {
  const id = makeRequestId('pr');
  await sql`
    INSERT INTO partnership_requests (id, locale, data)
    VALUES (${id}, ${params.locale}, ${JSON.stringify(params.data)}::jsonb)
  `;
  return id;
}

export async function listPartnershipRequests(): Promise<PartnershipRequestRecord[]> {
  const rows = (await sql`
    SELECT id, submitted_at, locale, data
    FROM partnership_requests
    ORDER BY submitted_at DESC
  `) as PartnershipRow[];
  return rows.map(partnershipRowToRecord);
}
