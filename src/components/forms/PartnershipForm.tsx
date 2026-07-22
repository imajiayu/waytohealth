'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { type Locale } from '@/i18n/config';
import { ArrowUpRight } from 'lucide-react';
import { track } from '@/lib/fbpixel';
import {
  INTEREST_AREA_VALUES,
  ORG_TYPE_VALUES,
  PARTNERSHIP_HAS_IDEA_VALUES,
  PARTNERSHIP_REFERRAL_VALUES,
  SUPPORT_WAY_VALUES,
} from '@/data/requests';
import { submitPartnershipRequestAction } from '@/app/actions/requests';
import {
  ChipCheckboxGroup,
  ChipRadioGroup,
  ConsentCheckbox,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from './fields';

const FIELD_KEYS = [
  'orgName',
  'contactName',
  'position',
  'phone',
  'email',
  'location',
  'orgType',
  'website',
  'supportWay',
  'interests',
  'hasIdea',
  'consent',
  'referral',
] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

function isFieldKey(v: string): v is FieldKey {
  return (FIELD_KEYS as readonly string[]).includes(v);
}

export default function PartnershipForm({ locale }: { locale: Locale }) {
  const t = useTranslations('forms.partnership');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [invalid, setInvalid] = useState<Set<FieldKey>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);

  const [orgType, setOrgType] = useState('');
  const [supportWay, setSupportWay] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [hasIdea, setHasIdea] = useState('');
  const [consent, setConsent] = useState(false);
  const [referral, setReferral] = useState('');

  const isInvalid = (k: FieldKey) => invalid.has(k);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('orgType', orgType);
    fd.set('supportWay', supportWay);
    fd.delete('interests');
    interests.forEach((v) => fd.append('interests', v));
    fd.set('hasIdea', hasIdea);
    fd.set('consent', consent ? 'on' : '');
    fd.set('referral', referral);
    fd.set('locale', locale);

    startTransition(async () => {
      const res = await submitPartnershipRequestAction(fd);
      if (res.ok) {
        track('Lead', { form: 'partnership' });
        router.push('/partnership/success');
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

  const supportWayOptions = SUPPORT_WAY_VALUES.map((v) => ({
    value: v,
    label: t(`fields.supportWay.options.${v}`),
  }));
  const interestOptions = INTEREST_AREA_VALUES.map((v) => ({
    value: v,
    label: t(`fields.interests.options.${v}`),
  }));
  const hasIdeaOptions = PARTNERSHIP_HAS_IDEA_VALUES.map((v) => ({
    value: v,
    label: t(`fields.hasIdea.options.${v}`),
  }));

  const showIdeaDescription = hasIdea === 'yes';

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* 组织 + 联系人 */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="orgName" required>
            {t('fields.orgName.label')}
          </FieldLabel>
          <TextInput id="orgName" name="orgName" autoComplete="organization" invalid={isInvalid('orgName')} />
        </div>
        <div>
          <FieldLabel htmlFor="orgType" required>
            {t('fields.orgType.label')}
          </FieldLabel>
          <SelectInput
            id="orgType"
            name="orgType"
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            invalid={isInvalid('orgType')}
          >
            <option value="" disabled>
              {t('fields.orgType.placeholder')}
            </option>
            {ORG_TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`fields.orgType.options.${v}`)}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="location" required>
            {t('fields.location.label')}
          </FieldLabel>
          <TextInput id="location" name="location" invalid={isInvalid('location')} />
        </div>
        <div>
          <FieldLabel htmlFor="website" required>
            {t('fields.website.label')}
          </FieldLabel>
          <TextInput id="website" name="website" inputMode="url" invalid={isInvalid('website')} />
        </div>
        <div>
          <FieldLabel htmlFor="contactName" required>
            {t('fields.contactName.label')}
          </FieldLabel>
          <TextInput id="contactName" name="contactName" autoComplete="name" invalid={isInvalid('contactName')} />
        </div>
        <div>
          <FieldLabel htmlFor="position" required>
            {t('fields.position.label')}
          </FieldLabel>
          <TextInput
            id="position"
            name="position"
            autoComplete="organization-title"
            invalid={isInvalid('position')}
          />
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

      {/* 合作方向 */}
      <div className="space-y-3">
        <div>
          <FieldLabel required>{t('fields.supportWay.label')}</FieldLabel>
          <ChipRadioGroup
            name="supportWay"
            value={supportWay}
            onChange={setSupportWay}
            options={supportWayOptions}
            invalid={isInvalid('supportWay')}
          />
        </div>
        <div>
          <FieldLabel required>
            {t('fields.interests.label')}
            <span className="ml-2 text-[11px] font-normal text-ukraine-blue-500">
              {t('fields.interests.hint')}
            </span>
          </FieldLabel>
          <ChipCheckboxGroup
            name="interests"
            values={interests}
            onChange={setInterests}
            options={interestOptions}
            invalid={isInvalid('interests')}
          />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div>
            <FieldLabel required>{t('fields.hasIdea.label')}</FieldLabel>
            <ChipRadioGroup
              name="hasIdea"
              value={hasIdea}
              onChange={setHasIdea}
              options={hasIdeaOptions}
              invalid={isInvalid('hasIdea')}
            />
          </div>
          <div>
            <FieldLabel htmlFor="referral" required>
              {t('fields.referral.label')}
            </FieldLabel>
            <SelectInput
              id="referral"
              name="referral"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              invalid={isInvalid('referral')}
            >
              <option value="" disabled>
                {t('fields.referral.placeholder')}
              </option>
              {PARTNERSHIP_REFERRAL_VALUES.map((v) => (
                <option key={v} value={v}>
                  {t(`fields.referral.options.${v}`)}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
        {showIdeaDescription && (
          <div className="animate-panel-forward">
            <FieldLabel htmlFor="ideaDescription">
              {t('fields.ideaDescription.label')}
              <span className="ml-2 text-[11px] font-normal text-ukraine-blue-500">
                {t('fields.ideaDescription.optionalSuffix')}
              </span>
            </FieldLabel>
            <TextArea id="ideaDescription" name="ideaDescription" rows={2} maxLength={3000} />
          </div>
        )}
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
