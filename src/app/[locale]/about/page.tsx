import { type Locale } from '@/i18n/config';
import VideoStory from '@/components/about/VideoStory';
import TeamCollage from '@/components/about/TeamCollage';
import DocumentLedger from '@/components/about/DocumentLedger';

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

type MetaItem = {
  label: string;
  value: string;
};

type AboutContent = {
  // 标题区
  eyebrow: string;
  title: string;
  titleAccent: string;

  // 首屏元数据 ── 期间 / 地点 / 范围
  meta: {
    period: MetaItem;
    location: MetaItem;
    scope: MetaItem;
  };

  // 章节标签
  chapters: {
    origin: string;
    impact: string;
    evolution: string;
    voices: string;
    ledger: string;
  };

  // 内容
  paragraphs: string[];
  impact: string;
  impactBig: string;
  impactSmall: string;
  followUp: string;

  // 视频
  videoEyebrow: string;
  videoTitle: string;
  videoMeta: string;
  videoRuntime: string;

  // 团队
  teamTitle: string;
  teamSubtitle: string;
  team: TeamMember[];

  // 文档
  transparencyTitle: string;
  transparencySubtitle: string;
  documents: DocumentItem[];
  ledgerLabels: { id: string; file: string; type: string; open: string };
};

const CONTENT: Record<Locale, AboutContent> = {
  ua: {
    eyebrow: 'Про благодійну організацію',
    title: 'Шлях, який',
    titleAccent: 'змінює життя',
    meta: {
      period: { label: 'Період', value: '2022 — сьогодні' },
      location: { label: 'Місце', value: 'смт. Слобожанське, Дніпропетровська область, Україна' },
      scope: { label: 'Сфера', value: 'Реабілітація, гуманітарна допомога, психологічна підтримка' },
    },
    chapters: {
      origin: 'Початок',
      impact: 'Вплив',
      evolution: 'Розвиток',
      voices: 'Команда',
      ledger: 'Звітність',
    },
    paragraphs: [
      'Благодійний фонд «Шлях до здоров\'я» був заснований у вересні 2022 року Микитою Жаліним та Олексієм Дубовиком у відповідь на зростаючу потребу в якісній реабілітації в Україні.',
      'Фонд залучає фінансову та ресурсну підтримку для забезпечення безкоштовної реабілітації пацієнтів, а також розвитку медичних програм. Команда активно працює з міжнародними партнерами, реалізує фандрейзингові ініціативи та забезпечує центр необхідним обладнанням і ресурсами для надання допомоги.',
    ],
    impact: 'З моменту створення фонд профінансував реабілітацію понад 500 пацієнтів із важкими травмами та пораненнями, допомагаючи їм повернутися до повноцінного життя.',
    impactBig: '500+',
    impactSmall: 'пацієнтів повернулись до повноцінного життя',
    followUp: 'Водночас із розвитком фонду розширювалися і напрями допомоги. Окрім підтримки реабілітації постраждалих від війни, БО «БФ "Шлях до здоров\'я"» також реалізує проєкти з психологічної підтримки, впровадження інноваційних методів відновлення, надання щоденної допомоги населенню, а також закупівлі обладнання та спеціалізованого транспорту.',
    videoEyebrow: 'Розмова зі співзасновником',
    videoTitle: 'Чому ми робимо те, що робимо',
    videoMeta: 'З Олексієм Дубовиком · спів­засновник',
    videoRuntime: 'Документальне відео',
    teamTitle: 'Команда',
    teamSubtitle: 'Люди, які щодня перетворюють підтримку на конкретні дії',
    team: [
      { name: 'Олександр Хорев', role: 'комунікаційний менеджер', image: '/images/team/oleksandr-khorev.jpg' },
      { name: 'Анастасія Сидоркіна', role: 'керівниця проєктів', image: '/images/team/anastasiia-sydorkina.jpg' },
      { name: 'Олексій Дубовик', role: 'співзасновник', image: '/images/team/oleksii-dubovyk.jpg' },
      { name: 'Олександр Федонюк', role: 'керівник фонду', image: '/images/team/oleksandr-fedoniuk.jpg' },
      { name: 'Єгор Воробйов', role: 'фандрейзер, грантрайтер', image: '/images/team/yehor-vorobiov.jpg' },
      { name: 'Софія Тарнавська', role: 'СММ менеджерка', image: '/images/team/sofiia-tarnavska.jpg' },
    ],
    transparencyTitle: 'Прозорість',
    transparencySubtitle: 'Повний реєстр документів — від статуту до річних фінансових звітів',
    documents: [
      { title: 'Статут', href: '/documents/about/statute.pdf' },
      { title: 'Витяг з реєстру неприбуткових організацій', href: '/documents/about/nonprofit-register-extract.pdf' },
      { title: 'Витяг ЄДРПОУ', href: '/documents/about/edr-extract.pdf' },
      { title: 'Річний звіт 2025', href: '/documents/about/annual-report-2025.pdf' },
      { title: 'Фінансовий звіт 2025', href: '/documents/about/financial-report-2025.pdf' },
    ],
    ledgerLabels: { id: '№', file: 'Документ', type: 'Тип', open: 'Відкрити' },
  },
  en: {
    eyebrow: 'About the charitable organization',
    title: 'A path that',
    titleAccent: 'changes lives',
    meta: {
      period: { label: 'Period', value: '2022 — present' },
      location: { label: 'Location', value: 'Slobozhanske, Dnipropetrovsk Oblast, Ukraine' },
      scope: { label: 'Scope', value: 'Rehabilitation, humanitarian aid, psychological support' },
    },
    chapters: {
      origin: 'Origin',
      impact: 'Impact',
      evolution: 'Evolution',
      voices: 'Team',
      ledger: 'Reporting',
    },
    paragraphs: [
      'The "Way to Health" Charity Foundation was established in September 2022 by Mykyta Zhalin and Oleksii Dubovyk in response to the growing need for quality rehabilitation in Ukraine.',
      'The foundation attracts financial and in-kind support to provide free rehabilitation for patients and to develop medical programs. The team actively works with international partners, runs fundraising initiatives, and equips the center with the resources needed to deliver care.',
    ],
    impact: 'Since its launch, the foundation has financed rehabilitation for more than 500 patients with severe injuries and trauma, helping them return to a full life.',
    impactBig: '500+',
    impactSmall: 'patients returned to a full life',
    followUp: 'As the foundation grew, so did its areas of support. In addition to rehabilitation for people affected by war, the organization also runs psychological support projects, introduces innovative recovery methods, provides day-to-day assistance for civilians, and procures equipment and specialized transport.',
    videoEyebrow: 'A conversation with the co-founder',
    videoTitle: 'Why we do what we do',
    videoMeta: 'With Oleksii Dubovyk · co-founder',
    videoRuntime: 'Documentary',
    teamTitle: 'Team',
    teamSubtitle: 'The people who turn support into action, every single day',
    team: [
      { name: 'Oleksandr Khorev', role: 'communications manager', image: '/images/team/oleksandr-khorev.jpg' },
      { name: 'Anastasiia Sydorkina', role: 'project lead', image: '/images/team/anastasiia-sydorkina.jpg' },
      { name: 'Oleksii Dubovyk', role: 'co-founder', image: '/images/team/oleksii-dubovyk.jpg' },
      { name: 'Oleksandr Fedoniuk', role: 'foundation director', image: '/images/team/oleksandr-fedoniuk.jpg' },
      { name: 'Yehor Vorobiov', role: 'fundraiser, grant writer', image: '/images/team/yehor-vorobiov.jpg' },
      { name: 'Sofiia Tarnavska', role: 'SMM manager', image: '/images/team/sofiia-tarnavska.jpg' },
    ],
    transparencyTitle: 'Transparency',
    transparencySubtitle: 'A full registry of documents — from the statute to annual financial reports',
    documents: [
      { title: 'Statute', href: '/documents/about/statute.pdf' },
      { title: 'Extract from the Register of Non-Profit Organizations', href: '/documents/about/nonprofit-register-extract.pdf' },
      { title: 'EDRPOU Extract', href: '/documents/about/edr-extract.pdf' },
      { title: 'Annual Report 2025', href: '/documents/about/annual-report-2025.pdf' },
      { title: 'Financial Report 2025', href: '/documents/about/financial-report-2025.pdf' },
    ],
    ledgerLabels: { id: '№', file: 'Document', type: 'Type', open: 'Open' },
  },
};

/** 章节编号 + 标签 — 重复使用的小组件 */
function ChapterMark({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-[family-name:var(--font-display)] text-[3.5rem] font-light leading-none text-ukraine-gold-500 sm:text-[4.5rem]">
        {number}
      </span>
      <div className="flex flex-col gap-1">
        <span className="h-px w-10 bg-ukraine-blue-300" />
        <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.28em] text-ukraine-blue-600 sm:text-xs">
          Chapter
        </span>
        <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-ukraine-blue-900 sm:text-lg">
          {label}
        </span>
      </div>
    </div>
  );
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const typedLocale: Locale = (locale as Locale) ?? 'ua';
  const content = CONTENT[typedLocale] ?? CONTENT.ua;
  const videoSrc = typedLocale === 'en' ? '/videos/about-en.mp4' : '/videos/about-ua.mp4';

  return (
    <article className="relative overflow-hidden">
      {/* ── 背景装饰光晕 ── */}
      <div className="pointer-events-none absolute -top-20 right-[-10%] h-[36rem] w-[36rem] rounded-full aura-cyan-xl opacity-50" />
      <div className="pointer-events-none absolute left-[-15%] top-[40%] h-[28rem] w-[28rem] rounded-full aura-gold-lg opacity-40" />
      <div className="pointer-events-none absolute right-[-10%] top-[80%] h-[32rem] w-[32rem] rounded-full aura-teal-md opacity-50" />

      {/* 装饰性垂直细线 ── 桌面端 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-[420px] bg-gradient-to-b from-transparent via-ukraine-blue-200/40 to-transparent lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px translate-x-[420px] bg-gradient-to-b from-transparent via-ukraine-blue-200/40 to-transparent lg:block"
      />

      <div className="container-page relative pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20">
        {/* ════════════════════════════════════════════
            MASTHEAD ── 杂志开篇
            ════════════════════════════════════════════ */}
        <header className="grid grid-cols-12 gap-6 sm:gap-8">
          {/* 左侧章节索引 ── 杂志目录式导航 */}
          <aside className="col-span-12 lg:col-span-3 lg:pt-2">
            <nav aria-label="Chapter index" className="space-y-5 border-l-2 border-ukraine-gold-500 pl-5 lg:space-y-6">
              {[
                { key: 'origin', number: '01', label: content.chapters.origin, href: '#chapter-origin' },
                { key: 'impact', number: '02', label: content.chapters.impact, href: '#chapter-impact' },
                { key: 'evolution', number: '03', label: content.chapters.evolution, href: '#chapter-evolution' },
                { key: 'voices', number: '04', label: content.chapters.voices, href: '#chapter-voices' },
                { key: 'ledger', number: '05', label: content.chapters.ledger, href: '#chapter-ledger' },
              ].map((chapter) => (
                <a key={chapter.key} href={chapter.href} className="group flex items-baseline gap-3">
                  <span className="font-[family-name:var(--font-display)] text-base font-light leading-none text-ukraine-gold-500 sm:text-lg">
                    {chapter.number}
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-sm italic text-ukraine-blue-700 transition-colors group-hover:text-ukraine-blue-900 sm:text-base">
                    {chapter.label}
                  </span>
                </a>
              ))}
            </nav>
          </aside>

          {/* 标题 + 引言 */}
          <div className="col-span-12 lg:col-span-9">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-ukraine-gold-500" />
              <span className="font-[family-name:var(--font-data)] text-[11px] font-semibold uppercase tracking-[0.28em] text-ukraine-gold-700 sm:text-xs">
                {content.eyebrow}
              </span>
            </div>

            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[2.5rem] font-medium leading-[0.95] tracking-[-0.02em] text-ukraine-blue-900 sm:mt-6 sm:text-[4rem] lg:text-[5.5rem]">
              {content.title}
              <br />
              <span className="italic text-ukraine-blue-500">{content.titleAccent}.</span>
            </h1>

            {/* 杂志元数据 strip ── 期间 / 地点 / 范围 */}
            <dl className="mt-6 grid grid-cols-1 gap-y-4 border-y border-ukraine-blue-200/60 py-4 sm:mt-8 sm:grid-cols-3 sm:gap-x-8 sm:py-5">
              {(['period', 'location', 'scope'] as const).map((key, i) => {
                const item = content.meta[key];
                return (
                  <div
                    key={key}
                    className={i > 0 ? 'sm:border-l sm:border-ukraine-blue-200/60 sm:pl-8' : ''}
                  >
                    <dt className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.28em] text-ukraine-blue-500">
                      {item.label}
                    </dt>
                    <dd className="mt-2 font-[family-name:var(--font-display)] text-[15px] font-medium leading-snug tracking-tight text-ukraine-blue-900 sm:text-base">
                      {item.value}
                    </dd>
                  </div>
                );
              })}
            </dl>

          </div>
        </header>

        {/* ════════════════════════════════════════════
            CHAPTER 01 ── ORIGIN
            ════════════════════════════════════════════ */}
        <section id="chapter-origin" className="mt-14 grid scroll-mt-24 grid-cols-12 gap-6 sm:mt-20 sm:gap-8">
          <div className="col-span-12 lg:col-span-3">
            <ChapterMark number="01" label={content.chapters.origin} />
          </div>

          <div className="col-span-12 lg:col-span-9 lg:pl-4">
            {/* 大首字母 + 第一段 */}
            <p className="font-[family-name:var(--font-display)] text-2xl leading-[1.45] tracking-tight text-ukraine-blue-900 sm:text-[1.75rem] sm:leading-[1.4]">
              <span
                className="float-left mt-1 mr-3 font-[family-name:var(--font-display)] text-[5.5rem] font-medium leading-[0.78] text-ukraine-gold-500 sm:mr-4 sm:text-[7rem]"
                aria-hidden="true"
              >
                {content.paragraphs[0]?.charAt(0)}
              </span>
              {content.paragraphs[0]?.slice(1)}
            </p>

            {/* 第二段 ── 缩进偏移 */}
            <p className="mt-6 max-w-3xl text-lg leading-[1.7] text-ukraine-blue-800/85 sm:ml-16 sm:mt-8 sm:text-[1.15rem]">
              {content.paragraphs[1]}
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CHAPTER 02 ── IMPACT (大数字 + 视频)
            ════════════════════════════════════════════ */}
        <section id="chapter-impact" className="mt-4 scroll-mt-24 sm:mt-6">
          <div className="relative z-10 grid grid-cols-12 gap-6 sm:gap-8">
            <div className="col-span-12 lg:col-span-3">
              <ChapterMark number="02" label={content.chapters.impact} />
            </div>
          </div>

          {/* 大数字浮雕区 ── 负 margin 让 500+ 与上方区域重叠 */}
          <div className="relative -mt-20 sm:-mt-36 lg:-mt-48">
            {/* 巨大描边数字背景 */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none text-center font-[family-name:var(--font-display)] text-[11rem] font-semibold leading-[0.78] tracking-[-0.04em] sm:text-[18rem] lg:text-[24rem]"
              style={{
                WebkitTextStroke: '1.5px rgba(245, 184, 0, 0.55)',
                color: 'transparent',
              }}
            >
              {content.impactBig}
            </div>

            {/* 数字下方的引文 */}
            <div className="relative -mt-8 grid grid-cols-12 gap-6 sm:-mt-16 sm:gap-8 lg:-mt-24">
              <div className="col-span-12 lg:col-span-3" />
              <div className="col-span-12 lg:col-span-9 lg:pl-4">
                <div className="border-l-2 border-ukraine-gold-500 pl-6 sm:pl-8">
                  <p className="font-[family-name:var(--font-display)] text-2xl font-medium leading-[1.35] tracking-tight text-ukraine-blue-900 sm:text-[1.85rem] lg:text-[2.1rem]">
                    {content.impact}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.28em] text-ukraine-blue-500 sm:text-xs">
                      {content.impactSmall}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 视频区 */}
          <div className="mt-10 grid grid-cols-12 gap-6 sm:mt-14 sm:gap-8">
            <div className="col-span-12 lg:col-span-2 lg:pt-2">
              {/* 左侧装饰：垂直运行字 */}
              <div className="hidden lg:block">
                <div
                  className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.32em] text-ukraine-blue-500"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  Watch · Listen · Witness
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-10">
              <VideoStory
                key={typedLocale}
                src={videoSrc}
                eyebrow={content.videoEyebrow}
                title={content.videoTitle}
                meta={content.videoMeta}
                runtime={content.videoRuntime}
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CHAPTER 03 ── EVOLUTION
            ════════════════════════════════════════════ */}
        <section id="chapter-evolution" className="mt-14 grid scroll-mt-24 grid-cols-12 gap-6 sm:mt-20 sm:gap-8">
          <div className="col-span-12 lg:col-span-3">
            <ChapterMark number="03" label={content.chapters.evolution} />
          </div>

          <div className="col-span-12 lg:col-span-9 lg:pl-4">
            <p className="text-lg leading-[1.75] text-ukraine-blue-800/85 sm:text-xl sm:leading-[1.7]">
              {content.followUp}
            </p>

            {/* 装饰：分章符 */}
            <div className="mt-6 flex items-center gap-3 sm:mt-8">
              <span className="h-px flex-1 bg-gradient-to-r from-ukraine-blue-200 via-ukraine-gold-300 to-transparent" />
              <span className="font-[family-name:var(--font-display)] text-2xl text-ukraine-gold-500">§</span>
              <span className="h-px flex-1 bg-gradient-to-l from-ukraine-blue-200 via-ukraine-gold-300 to-transparent" />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CHAPTER 04 ── VOICES (Team)
            ════════════════════════════════════════════ */}
        <section id="chapter-voices" className="mt-14 scroll-mt-24 sm:mt-20">
          <div className="grid grid-cols-12 gap-6 sm:gap-8">
            <div className="col-span-12 lg:col-span-3">
              <ChapterMark number="04" label={content.chapters.voices} />
            </div>
            <div className="col-span-12 lg:col-span-9 lg:pl-4">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ukraine-blue-900 sm:text-4xl lg:text-5xl">
                {content.teamTitle}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ukraine-blue-700/80 sm:text-lg">
                {content.teamSubtitle}
              </p>
            </div>
          </div>

          <div className="mt-8 sm:mt-10">
            <TeamCollage members={content.team} />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CHAPTER 05 ── LEDGER (Documents)
            ════════════════════════════════════════════ */}
        <section id="chapter-ledger" className="mt-14 scroll-mt-24 sm:mt-20">
          <div className="grid grid-cols-12 gap-6 sm:gap-8">
            <div className="col-span-12 lg:col-span-3">
              <ChapterMark number="05" label={content.chapters.ledger} />
            </div>
            <div className="col-span-12 lg:col-span-9 lg:pl-4">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ukraine-blue-900 sm:text-4xl lg:text-5xl">
                {content.transparencyTitle}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ukraine-blue-700/80 sm:text-lg">
                {content.transparencySubtitle}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-12 gap-6 sm:mt-8 sm:gap-8">
            <div className="col-span-12 lg:col-span-3 lg:pt-2">
              {/* 装饰印章 */}
              <div className="hidden lg:block">
                <div className="relative inline-flex h-32 w-32 items-center justify-center rounded-full border border-ukraine-gold-500/40">
                  <div className="absolute inset-2 rounded-full border border-ukraine-gold-500/30" style={{ borderStyle: 'dashed' }} />
                  <div className="text-center">
                    <div className="font-[family-name:var(--font-data)] text-[9px] font-bold uppercase tracking-[0.22em] text-ukraine-gold-700">
                      Verified
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-medium leading-none text-ukraine-blue-800">2025</div>
                    <div className="mt-1 font-[family-name:var(--font-data)] text-[8px] uppercase tracking-[0.2em] text-ukraine-gold-600">
                      Open files
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-9">
              <DocumentLedger documents={content.documents} labels={content.ledgerLabels} />
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
