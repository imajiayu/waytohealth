import Image from 'next/image';
import { type Locale } from '@/i18n/config';

type Props = {
  params: Promise<{ locale: string }>;
};

type TeamMember = {
  name: string;
  role: string;
  image?: string;
};

type DocumentItem = {
  title: string;
  href: string;
};

type AboutContent = {
  title: string;
  paragraphs: string[];
  videoLabel: string;
  impact: string;
  followUp: string;
  teamTitle: string;
  team: TeamMember[];
  transparencyTitle: string;
  documents: DocumentItem[];
};

const CONTENT: Record<Locale, AboutContent> = {
  ua: {
    title: 'Про благодійну організацію',
    paragraphs: [
      'Благодійний фонд «Шлях до здоров’я» був заснований у вересні 2022 року Микитою Жаліним та Олексієм Дубовиком у відповідь на зростаючу потребу в якісній реабілітації в Україні.',
      'Фонд залучає фінансову та ресурсну підтримку для забезпечення безкоштовної реабілітації пацієнтів, а також розвитку медичних програм. Команда активно працює з міжнародними партнерами, реалізує фандрейзингові ініціативи та забезпечує центр необхідним обладнанням і ресурсами для надання допомоги.',
    ],
    videoLabel: 'ВІДЕО З ОЛЕКСІЄМ',
    impact: 'З моменту створення фонд профінансував реабілітацію понад 500 пацієнтів із важкими травмами та пораненнями, допомагаючи їм повернутися до повноцінного життя.',
    followUp: 'Водночас із розвитком фонду розширювалися і напрями допомоги. Окрім підтримки реабілітації постраждалих від війни, БО «БФ “Шлях до здоров’я”» також реалізує проєкти з психологічної підтримки, впровадження інноваційних методів відновлення, надання щоденної допомоги населенню, а також закупівлі обладнання та спеціалізованого транспорту.',
    teamTitle: 'Команда',
    team: [
      { name: 'Олексій Дубовик', role: 'співзасновник', image: '/images/team/oleksii-dubovyk.jpg' },
      { name: 'Олександр Феднюк', role: 'керівник фонду', image: '/images/team/oleksandr-fedoniuk.jpg' },
      { name: 'Олександр Хорев', role: 'комунікаційний менеджер', image: '/images/team/oleksandr-khorev.jpg' },
      { name: 'Анастасія Сидоркіна', role: 'керівниця проєктів', image: '/images/team/anastasiia-sydorkina.jpg' },
      { name: 'Єгор Воробйов', role: 'фандрейзер, грантрайтер' },
    ],
    transparencyTitle: 'Прозорість та звітність',
    documents: [
      { title: 'Статут', href: '/documents/about/statute.pdf' },
      { title: 'Витяг з реєстру неприбуткових організацій', href: '/documents/about/nonprofit-register-extract.pdf' },
      { title: 'Витяг ЄДРПОУ', href: '/documents/about/edr-extract.pdf' },
      { title: 'Річний звіт 2025', href: '/documents/about/annual-report-2025.pdf' },
      { title: 'Фінансовий звіт 2025', href: '/documents/about/financial-report-2025.pdf' },
    ],
  },
  en: {
    title: 'About the charitable organization',
    paragraphs: [
      'The “Way to Health” Charity Foundation was established in September 2022 by Mykyta Zhalin and Oleksii Dubovyk in response to the growing need for quality rehabilitation in Ukraine.',
      'The foundation attracts financial and in-kind support to provide free rehabilitation for patients and to develop medical programs. The team actively works with international partners, runs fundraising initiatives, and equips the center with the resources needed to deliver care.',
    ],
    videoLabel: 'VIDEO WITH OLEKSII',
    impact: 'Since its launch, the foundation has financed rehabilitation for more than 500 patients with severe injuries and trauma, helping them return to a full life.',
    followUp: 'As the foundation grew, so did its areas of support. In addition to rehabilitation for people affected by war, the organization also runs psychological support projects, introduces innovative recovery methods, provides day-to-day assistance for civilians, and procures equipment and specialized transport.',
    teamTitle: 'Team',
    team: [
      { name: 'Oleksii Dubovyk', role: 'co-founder', image: '/images/team/oleksii-dubovyk.jpg' },
      { name: 'Oleksandr Fedniuk', role: 'foundation director', image: '/images/team/oleksandr-fedoniuk.jpg' },
      { name: 'Oleksandr Khorev', role: 'communications manager', image: '/images/team/oleksandr-khorev.jpg' },
      { name: 'Anastasiia Sydorkina', role: 'project lead', image: '/images/team/anastasiia-sydorkina.jpg' },
      { name: 'Yehor Vorobiov', role: 'fundraiser, grant writer' },
    ],
    transparencyTitle: 'Transparency and Reporting',
    documents: [
      { title: 'Statute', href: '/documents/about/statute.pdf' },
      { title: 'Extract from the Register of Non-Profit Organizations', href: '/documents/about/nonprofit-register-extract.pdf' },
      { title: 'EDRPOU Extract', href: '/documents/about/edr-extract.pdf' },
      { title: 'Annual Report 2025', href: '/documents/about/annual-report-2025.pdf' },
      { title: 'Financial Report 2025', href: '/documents/about/financial-report-2025.pdf' },
    ],
  },
};

function MediaPlaceholder({ label }: { label?: string }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-dashed border-ukraine-blue-200/80 bg-white/80 shadow-[0_24px_60px_rgba(0,108,178,0.08)]">
      {label ? (
        <div className="border-b border-ukraine-blue-100 bg-ukraine-gold-100/80 px-4 py-3 font-[family-name:var(--font-data)] text-xs font-semibold tracking-[0.18em] text-ukraine-blue-800">
          {label}
        </div>
      ) : null}
      <div className="aspect-[16/9] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(230,244,248,0.92))]" />
    </div>
  );
}

function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {members.map((member) => (
          <div key={member.name} className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="mb-4 overflow-hidden rounded-2xl bg-gray-100">
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  width={1200}
                  height={1600}
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/5] w-full bg-[linear-gradient(135deg,rgba(230,244,248,0.95),rgba(255,255,255,0.9))]" />
              )}
            </div>
            <p className="text-lg font-semibold text-gray-950">{member.name}</p>
            <p className="mt-1 text-sm text-gray-600">{member.role}</p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[28px] border border-gray-300 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.05)] md:block">
        <div className="grid grid-cols-3">
          {members.map((member) => (
            <div key={member.name} className="min-h-28 border-r border-b border-gray-300 px-4 py-4 last:border-r-0 [&:nth-child(3n)]:border-r-0">
              <div className="mb-4 overflow-hidden rounded-2xl bg-gray-100">
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={1200}
                    height={1600}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[4/5] w-full bg-[linear-gradient(135deg,rgba(230,244,248,0.95),rgba(255,255,255,0.9))]" />
                )}
              </div>
              <p className="text-[1.05rem] font-semibold leading-snug text-gray-950">{member.name}</p>
              <p className="mt-1 text-sm leading-snug text-gray-600">{member.role}</p>
            </div>
          ))}
          <div aria-hidden="true" className="min-h-28 border-b border-gray-300" />
        </div>
      </div>
    </>
  );
}

function DocumentsGrid({ documents }: { documents: DocumentItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {documents.map((document, index) => (
        <a
          key={document.href}
          href={document.href}
          target="_blank"
          rel="noreferrer"
          className="group rounded-[28px] border border-ukraine-blue-100 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(0,108,178,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-ukraine-blue-300 hover:shadow-[0_24px_50px_rgba(0,108,178,0.12)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-[family-name:var(--font-data)] text-xs font-semibold tracking-[0.18em] text-ukraine-blue-500">
                PDF {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-3 text-xl font-semibold leading-snug text-gray-950">{document.title}</h3>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ukraine-blue-50 text-ukraine-blue-600 transition-colors duration-300 group-hover:bg-ukraine-blue-500 group-hover:text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const content = CONTENT[(locale as Locale) ?? 'ua'] ?? CONTENT.ua;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full aura-cyan-xl opacity-50" />
      <div className="pointer-events-none absolute -left-32 top-72 h-80 w-80 rounded-full aura-gold-lg opacity-40" />

      <div className="container-page relative py-8 sm:py-12 lg:py-16">
        <section className="rounded-[32px] border border-white/70 bg-white/88 px-5 py-8 shadow-[0_32px_80px_rgba(0,108,178,0.10)] backdrop-blur-sm sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.85fr)] lg:items-start">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
                {content.title}
              </h1>

              <div className="mt-8 space-y-6 text-lg leading-relaxed text-gray-800">
                {content.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-8 max-w-3xl rounded-[24px] border border-ukraine-gold-200 bg-ukraine-gold-50/90 px-5 py-5 shadow-[0_12px_28px_rgba(245,184,0,0.12)]">
                <p className="text-lg font-semibold leading-relaxed text-gray-950">{content.impact}</p>
              </div>

              <p className="mt-8 text-lg leading-relaxed text-gray-800">{content.followUp}</p>
            </div>

            <div className="lg:sticky lg:top-24">
              <MediaPlaceholder label={content.videoLabel} />
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-white/70 bg-white/90 px-5 py-8 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-8 sm:py-10 lg:px-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
              {content.teamTitle}
            </h2>
            <div className="hidden h-px flex-1 bg-gradient-to-r from-ukraine-blue-100 via-ukraine-gold-300 to-transparent md:block" />
          </div>

          <div className="mt-6">
            <TeamGrid members={content.team} />
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-white/70 bg-white/86 px-5 py-8 shadow-[0_24px_64px_rgba(0,108,178,0.08)] backdrop-blur-sm sm:px-8 sm:py-10 lg:px-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
              {content.transparencyTitle}
            </h2>
            <div className="hidden h-px flex-1 bg-gradient-to-r from-ukraine-blue-100 via-ukraine-blue-300 to-transparent md:block" />
          </div>

          <div className="mt-6">
            <DocumentsGrid documents={content.documents} />
          </div>
        </section>
      </div>
    </div>
  );
}
