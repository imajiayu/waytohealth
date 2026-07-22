import { Mail, MapPin, Phone } from 'lucide-react';
import ContactLink from '@/components/analytics/ContactLink';

interface ContactCardsProps {
  email: string;
  emailLabel: string;
  address: string;
  addressLabel: string;
  phone: string;
  phoneLabel: string;
}

/** 法律页（privacy / terms / public-agreements）共用的三联联系卡片 */
export default function ContactCards({
  email,
  emailLabel,
  address,
  addressLabel,
  phone,
  phoneLabel,
}: ContactCardsProps) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {/* Email */}
      <ContactLink
        href={`mailto:${email}`}
        channel="email"
        className="group relative overflow-hidden rounded-2xl border border-ukraine-blue-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/50"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ukraine-blue-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-ukraine-blue-200/50 transition-shadow duration-300 group-hover:shadow-ukraine-blue-300/60">
            <Mail className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <p className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-400">
            {emailLabel}
          </p>
          <p className="mt-2 break-all text-sm font-medium text-ukraine-blue-800 transition-colors group-hover:text-ukraine-blue-600 sm:text-[15px]">
            {email}
          </p>
        </div>
      </ContactLink>

      {/* Address */}
      <div className="group relative overflow-hidden rounded-2xl border border-ukraine-blue-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/50">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ukraine-gold-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-ukraine-blue-200/50 transition-shadow duration-300 group-hover:shadow-ukraine-blue-300/60">
            <MapPin className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <p className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-400">
            {addressLabel}
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-ukraine-blue-800 sm:text-[15px]">
            {address}
          </p>
        </div>
      </div>

      {/* Phone */}
      <ContactLink
        href={`tel:${phone.replace(/\s/g, '')}`}
        channel="phone"
        className="group relative overflow-hidden rounded-2xl border border-ukraine-blue-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-200 hover:shadow-xl hover:shadow-ukraine-blue-100/50"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ukraine-blue-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-lg shadow-ukraine-blue-200/50 transition-shadow duration-300 group-hover:shadow-ukraine-blue-300/60">
            <Phone className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <p className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.22em] text-ukraine-blue-400">
            {phoneLabel}
          </p>
          <p className="mt-2 font-[family-name:var(--font-data)] text-sm font-medium tracking-wide text-ukraine-blue-800 transition-colors group-hover:text-ukraine-blue-600 sm:text-[15px]">
            {phone}
          </p>
        </div>
      </ContactLink>
    </div>
  );
}
