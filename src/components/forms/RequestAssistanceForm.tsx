'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { type Locale } from '@/i18n/config';
import { ArrowUpRight } from 'lucide-react';
import { track } from '@/lib/fbpixel';
import {
  ASSISTANCE_APPLICANT_VALUES,
  ASSISTANCE_REFERRAL_VALUES,
  ASSISTANCE_TYPE_VALUES,
} from '@/data/requests';
import { submitAssistanceRequestAction } from '@/app/actions/requests';
import {
  ChipRadioGroup,
  ConsentCheckbox,
  FieldLabel,
  TextArea,
  TextInput,
} from './fields';

const FIELD_KEYS = [
  'fullName',
  'phone',
  'email',
  'city',
  'applicant',
  'assistance',
  'description',
  'consent',
  'referral',
] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

function isFieldKey(v: string): v is FieldKey {
  return (FIELD_KEYS as readonly string[]).includes(v);
}

export default function RequestAssistanceForm({ locale }: { locale: Locale }) {
  const t = useTranslations('forms.requestAssistance');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [invalid, setInvalid] = useState<Set<FieldKey>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);

  const [applicant, setApplicant] = useState('');
  const [assistance, setAssistance] = useState('');
  const [consent, setConsent] = useState(false);
  const [referral, setReferral] = useState('');

  const isInvalid = (k: FieldKey) => invalid.has(k);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('applicant', applicant);
    fd.set('assistance', assistance);
    fd.set('referral', referral);
    fd.set('consent', consent ? 'on' : '');
    fd.set('locale', locale);

    startTransition(async () => {
      const res = await submitAssistanceRequestAction(fd);
      if (res.ok) {
        track('Lead', { form: 'assistance' });
        router.push('/request-assistance/success');
        return;
      }
      if (res.error === 'invalid') {
        setInvalid(new Set((res.fields ?? []).filter(isFieldKey)));
        setFormError(t('errors.invalid'));
      } else if (res.error === 'rate_limited') {
        setFormError(t('errors.rateLimited'));
      } else {
        setFormError(t('errors.server'));
      }
    });
  }

  const applicantOptions = ASSISTANCE_APPLICANT_VALUES.map((v) => ({
    value: v,
    label: t(`fields.applicant.options.${v}`),
  }));
  const assistanceOptions = ASSISTANCE_TYPE_VALUES.map((v) => ({
    value: v,
    label: t(`fields.assistance.options.${v}`),
  }));
  const referralOptions = ASSISTANCE_REFERRAL_VALUES.map((v) => ({
    value: v,
    label: t(`fields.referral.options.${v}`),
  }));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* 联系人 */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="fullName" required>
            {t('fields.fullName.label')}
          </FieldLabel>
          <TextInput id="fullName" name="fullName" autoComplete="name" invalid={isInvalid('fullName')} />
        </div>
        <div>
          <FieldLabel htmlFor="city" required>
            {t('fields.city.label')}
          </FieldLabel>
          <TextInput id="city" name="city" autoComplete="address-level2" invalid={isInvalid('city')} />
        </div>
        <div>
          <FieldLabel htmlFor="phone" required>
            {t('fields.phone.label')}
          </FieldLabel>
          <TextInput
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t('fields.phone.placeholder')}
            invalid={isInvalid('phone')}
          />
        </div>
        <div>
          <FieldLabel htmlFor="email" required>
            {t('fields.email.label')}
          </FieldLabel>
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('fields.email.placeholder')}
            invalid={isInvalid('email')}
          />
        </div>
      </div>

      <hr className="border-ukraine-blue-100/80" />

      {/* 请求内容 */}
      <div className="space-y-3">
        <div>
          <FieldLabel required>{t('fields.applicant.label')}</FieldLabel>
          <ChipRadioGroup
            name="applicant"
            value={applicant}
            onChange={setApplicant}
            options={applicantOptions}
            invalid={isInvalid('applicant')}
          />
        </div>
        <div>
          <FieldLabel required>{t('fields.assistance.label')}</FieldLabel>
          <ChipRadioGroup
            name="assistance"
            value={assistance}
            onChange={setAssistance}
            options={assistanceOptions}
            invalid={isInvalid('assistance')}
          />
        </div>
        <div>
          <FieldLabel htmlFor="description" required>
            {t('fields.description.label')}
          </FieldLabel>
          <TextArea
            id="description"
            name="description"
            rows={3}
            maxLength={3000}
            invalid={isInvalid('description')}
          />
        </div>
      </div>

      <hr className="border-ukraine-blue-100/80" />

      {/* 来源 */}
      <div>
        <FieldLabel required>{t('fields.referral.label')}</FieldLabel>
        <ChipRadioGroup
          name="referral"
          value={referral}
          onChange={setReferral}
          options={referralOptions}
          invalid={isInvalid('referral')}
        />
      </div>

      <hr className="border-ukraine-blue-100/80" />

      {/* 提交栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ConsentCheckbox
          id="consent"
          name="consent"
          checked={consent}
          onChange={setConsent}
          label={t('fields.consent.label')}
          invalid={isInvalid('consent')}
        />
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex items-center gap-2 rounded-full bg-ukraine-blue-900 px-6 py-2.5 text-[13px] font-semibold tracking-wide text-white shadow-[0_4px_14px_rgba(0,36,58,0.25)] transition hover:bg-ukraine-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t('submitting') : t('submit')}
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={2.2}
          />
        </button>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-md border border-warm-500/40 bg-warm-500/10 px-4 py-2.5 text-[13px] text-warm-500"
        >
          {formError}
        </div>
      )}
    </form>
  );
}
