/**
 * 前台表单（Request Assistance / Partnership）提交的类型定义。
 *
 * 结构按原 Google Form 题目一一映射；问题文本（题干）不出现在这里，
 * 而是放在 messages/{locale}.json 的 forms 命名空间中由 UI 消费。
 */

/* ── Assistance Request ──────────────────────────────────────────────── */

// 原表单 Q6：谁在提交
export const ASSISTANCE_APPLICANT_VALUES = [
  'self',
  'relative',
  'representative',
] as const;
export type AssistanceApplicant = (typeof ASSISTANCE_APPLICANT_VALUES)[number];

// 原表单 Q7：需要哪种帮助
export const ASSISTANCE_TYPE_VALUES = [
  'physical',
  'psychological',
  'medical',
  'transport',
  'other',
] as const;
export type AssistanceType = (typeof ASSISTANCE_TYPE_VALUES)[number];

// 原表单 Q10：如何得知（assistance）
export const ASSISTANCE_REFERRAL_VALUES = [
  'social',
  'google',
  'acquaintance',
  'media',
  'events',
  'other',
] as const;
export type AssistanceReferral = (typeof ASSISTANCE_REFERRAL_VALUES)[number];

export interface AssistanceRequestData {
  fullName: string;      // Q2
  phone: string;         // Q3
  email: string;         // Q4 Email
  city: string;          // Q5
  applicant: AssistanceApplicant;  // Q6
  assistance: AssistanceType;      // Q7
  description: string;             // Q8
  consent: true;                   // Q9（提交时已校验 true）
  referral: AssistanceReferral;    // Q10
}

export interface AssistanceRequestRecord {
  id: string;
  submitted_at: string;  // ISO
  locale: 'ua' | 'en';
  data: AssistanceRequestData;
}

/* ── Partnership Request ─────────────────────────────────────────────── */

// 原表单 Q7：组织类型
export const ORG_TYPE_VALUES = [
  'business',
  'charity',
  'international',
  'government',
  'volunteer',
  'other',
] as const;
export type OrgType = (typeof ORG_TYPE_VALUES)[number];

// 原表单 Q9：支持方式（单选）
export const SUPPORT_WAY_VALUES = [
  'financial',
  'joint-projects',
  'information',
  'goods',
  'services',
  'other',
] as const;
export type SupportWay = (typeof SUPPORT_WAY_VALUES)[number];

// 原表单 Q10：感兴趣方向（多选）
export const INTEREST_AREA_VALUES = [
  'inpatient',
  'physical',
  'psychological',
  'humanitarian',
  'innovation',
  'equipment',
  'transport',
  'other',
] as const;
export type InterestArea = (typeof INTEREST_AREA_VALUES)[number];

// 原表单 Q11：是否已有合作想法
export const PARTNERSHIP_HAS_IDEA_VALUES = ['yes', 'no'] as const;
export type PartnershipHasIdea = (typeof PARTNERSHIP_HAS_IDEA_VALUES)[number];

// 原表单 Q14：如何得知（partnership）
export const PARTNERSHIP_REFERRAL_VALUES = [
  'social',
  'google',
  'colleagues',
  'media',
  'events',
  'other',
] as const;
export type PartnershipReferral = (typeof PARTNERSHIP_REFERRAL_VALUES)[number];

export interface PartnershipRequestData {
  orgName: string;           // Q1
  contactName: string;       // Q2
  position: string;          // Q3
  phone: string;             // Q4
  email: string;             // Q5
  location: string;          // Q6
  orgType: OrgType;          // Q7
  website: string;           // Q8
  supportWay: SupportWay;    // Q9
  interests: InterestArea[]; // Q10 （多选）
  hasIdea: PartnershipHasIdea; // Q11
  ideaDescription: string;   // Q12（Q11 为 yes 时可选填）
  consent: true;             // Q13
  referral: PartnershipReferral; // Q14
}

export interface PartnershipRequestRecord {
  id: string;
  submitted_at: string;
  locale: 'ua' | 'en';
  data: PartnershipRequestData;
}
