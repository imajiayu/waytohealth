'use server';

import {
  ASSISTANCE_APPLICANT_VALUES,
  ASSISTANCE_REFERRAL_VALUES,
  ASSISTANCE_TYPE_VALUES,
  INTEREST_AREA_VALUES,
  ORG_TYPE_VALUES,
  PARTNERSHIP_HAS_IDEA_VALUES,
  PARTNERSHIP_REFERRAL_VALUES,
  SUPPORT_WAY_VALUES,
  type AssistanceApplicant,
  type AssistanceReferral,
  type AssistanceRequestData,
  type AssistanceRequestRecord,
  type AssistanceType,
  type InterestArea,
  type OrgType,
  type PartnershipHasIdea,
  type PartnershipReferral,
  type PartnershipRequestData,
  type PartnershipRequestRecord,
  type SupportWay,
} from '@/data/requests';
import { isLocale } from '@/i18n/config';
import {
  insertAssistanceRequest,
  insertPartnershipRequest,
  listAssistanceRequests,
  listPartnershipRequests,
} from '@/lib/requests';
import { ensureAdmin } from '@/lib/adminSession';
import { checkFormRateLimit } from '@/lib/formRateLimit';
import { getClientIp } from '@/lib/clientIp';
import { EMAIL_RE } from '@/lib/email';
import { errorMessage } from '@/lib/errors';

/* ── 工具：字段校验 ──────────────────────────────────────────────────── */

function text(v: FormDataEntryValue | null, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function optionalText(v: FormDataEntryValue | null, max: number): string {
  return text(v, max);
}

function enumValue<T extends string>(v: FormDataEntryValue | null, allowed: readonly T[]): T | null {
  if (typeof v !== 'string') return null;
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

function enumArray<T extends string>(values: FormDataEntryValue[], allowed: readonly T[]): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    if (typeof v !== 'string') continue;
    if (!(allowed as readonly string[]).includes(v)) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v as T);
  }
  return out;
}

export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; error: 'invalid' | 'rate_limited' | 'server_error'; fields?: string[] };

/* ── Assistance submission ───────────────────────────────────────────── */

export async function submitAssistanceRequestAction(formData: FormData): Promise<SubmitResult> {
  const rawLocale = formData.get('locale');
  const locale = typeof rawLocale === 'string' && isLocale(rawLocale) ? rawLocale : 'ua';

  const fullName = text(formData.get('fullName'), 200);
  const phone = text(formData.get('phone'), 50);
  const email = text(formData.get('email'), 200);
  const city = text(formData.get('city'), 150);
  const applicant = enumValue<AssistanceApplicant>(formData.get('applicant'), ASSISTANCE_APPLICANT_VALUES);
  const assistance = enumValue<AssistanceType>(formData.get('assistance'), ASSISTANCE_TYPE_VALUES);
  const description = text(formData.get('description'), 3000);
  const consent = formData.get('consent') === 'on' || formData.get('consent') === 'true';
  const referral = enumValue<AssistanceReferral>(formData.get('referral'), ASSISTANCE_REFERRAL_VALUES);

  const invalid: string[] = [];
  if (!fullName) invalid.push('fullName');
  if (!phone) invalid.push('phone');
  if (!email || !EMAIL_RE.test(email)) invalid.push('email');
  if (!city) invalid.push('city');
  if (!applicant) invalid.push('applicant');
  if (!assistance) invalid.push('assistance');
  if (!description) invalid.push('description');
  if (!consent) invalid.push('consent');
  if (!referral) invalid.push('referral');

  if (invalid.length > 0 || !applicant || !assistance || !referral) {
    return { ok: false, error: 'invalid', fields: invalid };
  }

  const data: AssistanceRequestData = {
    fullName,
    phone,
    email,
    city,
    applicant,
    assistance,
    description,
    consent: true,
    referral,
  };

  try {
    const ip = await getClientIp();
    if (!(await checkFormRateLimit('assist', ip))) {
      return { ok: false, error: 'rate_limited' };
    }
    const id = await insertAssistanceRequest({ locale, data });
    return { ok: true, id };
  } catch (err) {
    console.error('[requests:assistance] submit failed', err);
    return { ok: false, error: 'server_error' };
  }
}

/* ── Partnership submission ──────────────────────────────────────────── */

export async function submitPartnershipRequestAction(formData: FormData): Promise<SubmitResult> {
  const rawLocale = formData.get('locale');
  const locale = typeof rawLocale === 'string' && isLocale(rawLocale) ? rawLocale : 'ua';

  const orgName = text(formData.get('orgName'), 200);
  const contactName = text(formData.get('contactName'), 200);
  const position = text(formData.get('position'), 150);
  const phone = text(formData.get('phone'), 50);
  const email = text(formData.get('email'), 200);
  const location = text(formData.get('location'), 200);
  const orgType = enumValue<OrgType>(formData.get('orgType'), ORG_TYPE_VALUES);
  const website = text(formData.get('website'), 500);
  const supportWay = enumValue<SupportWay>(formData.get('supportWay'), SUPPORT_WAY_VALUES);
  const interests = enumArray<InterestArea>(formData.getAll('interests'), INTEREST_AREA_VALUES);
  const hasIdea = enumValue<PartnershipHasIdea>(formData.get('hasIdea'), PARTNERSHIP_HAS_IDEA_VALUES);
  const ideaDescription = optionalText(formData.get('ideaDescription'), 3000);
  const consent = formData.get('consent') === 'on' || formData.get('consent') === 'true';
  const referral = enumValue<PartnershipReferral>(formData.get('referral'), PARTNERSHIP_REFERRAL_VALUES);

  const invalid: string[] = [];
  if (!orgName) invalid.push('orgName');
  if (!contactName) invalid.push('contactName');
  if (!position) invalid.push('position');
  if (!phone) invalid.push('phone');
  if (!email || !EMAIL_RE.test(email)) invalid.push('email');
  if (!location) invalid.push('location');
  if (!orgType) invalid.push('orgType');
  if (!website) invalid.push('website');
  if (!supportWay) invalid.push('supportWay');
  if (interests.length === 0) invalid.push('interests');
  if (!hasIdea) invalid.push('hasIdea');
  if (!consent) invalid.push('consent');
  if (!referral) invalid.push('referral');

  if (invalid.length > 0 || !orgType || !supportWay || !hasIdea || !referral) {
    return { ok: false, error: 'invalid', fields: invalid };
  }

  const data: PartnershipRequestData = {
    orgName,
    contactName,
    position,
    phone,
    email,
    location,
    orgType,
    website,
    supportWay,
    interests,
    hasIdea,
    ideaDescription,
    consent: true,
    referral,
  };

  try {
    const ip = await getClientIp();
    if (!(await checkFormRateLimit('partner', ip))) {
      return { ok: false, error: 'rate_limited' };
    }
    const id = await insertPartnershipRequest({ locale, data });
    return { ok: true, id };
  } catch (err) {
    console.error('[requests:partnership] submit failed', err);
    return { ok: false, error: 'server_error' };
  }
}

/* ── Admin 只读 ──────────────────────────────────────────────────────── */

export async function listAssistanceRequestsAction(): Promise<
  { ok: true; items: AssistanceRequestRecord[] } | { ok: false; error: string }
> {
  const guard = await ensureAdmin();
  if (guard) return guard;
  try {
    return { ok: true, items: await listAssistanceRequests() };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function listPartnershipRequestsAction(): Promise<
  { ok: true; items: PartnershipRequestRecord[] } | { ok: false; error: string }
> {
  const guard = await ensureAdmin();
  if (guard) return guard;
  try {
    return { ok: true, items: await listPartnershipRequests() };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
