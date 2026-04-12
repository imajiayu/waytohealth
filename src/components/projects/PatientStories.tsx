'use client';

import { useState } from 'react';
import { type Locale } from '@/i18n/config';
import { type PatientStory, type LocaleString } from '@/data/projects';
import { useTranslations } from 'next-intl';
import { User } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Props {
  stories: PatientStory[];
  storiesHeader?: LocaleString;
  locale: Locale;
  projectId: number;
}

export default function PatientStories({
  stories,
  storiesHeader,
  locale,
  projectId,
}: Props) {
  const t = useTranslations('projectDetail');
  const [activeIndex, setActiveIndex] = useState(0);
  const story = stories[activeIndex];
  const photoBase = `/data/projects/${projectId}`;
  const hasComparison = story.photoBefore && story.photoAfter;

  return (
    <section className="mt-16 sm:mt-20">
      {/* 故事标题 */}
      {storiesHeader && (
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ukraine-blue-900 sm:text-3xl">
          {storiesHeader[locale]}
        </h2>
      )}

      {/* ── 人物选择器 ── */}
      <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-4">
        {stories.map((s, i) => {
          const isActive = i === activeIndex;
          const selectorPhoto = s.photoAfter || s.photoBefore || s.photo;

          return (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'group relative rounded-xl text-left transition-all duration-300',
                isActive
                  ? 'ring-2 ring-ukraine-gold-500/80 shadow-[0_4px_20px_rgba(245,184,0,0.12)]'
                  : 'opacity-55 saturate-[0.6] hover:opacity-80 hover:saturate-100',
              )}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                {selectorPhoto ? (
                  <Image
                    src={`${photoBase}/${selectorPhoto}`}
                    alt={s.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 30vw, 200px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-ukraine-blue-50 to-ukraine-blue-100/60">
                    <User className="h-10 w-10 text-ukraine-blue-200" />
                  </div>
                )}

                {/* 底部暗渐变 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                {/* 姓名 + 角色 */}
                <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 sm:px-3 sm:pb-3">
                  <span className="mb-0.5 inline-block rounded-full bg-white/20 px-1.5 py-px font-[family-name:var(--font-data)] text-[8px] font-semibold uppercase tracking-[0.12em] text-white/80 backdrop-blur-sm sm:text-[9px]">
                    {s.role[locale]}
                  </span>
                  <h3 className="font-[family-name:var(--font-display)] text-sm font-bold leading-tight text-white sm:text-base">
                    {s.name}
                  </h3>
                </div>

              </div>
            </button>
          );
        })}
      </div>

      {/* ── 故事详情面板 ── */}
      <div
        key={activeIndex}
        className="mt-3 overflow-hidden rounded-xl border border-ukraine-blue-100/40 bg-white/80 shadow-[0_2px_12px_rgba(0,108,178,0.05)] backdrop-blur-sm sm:mt-4"
        style={{
          animation:
            'detail-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* 对比照横幅 */}
        {hasComparison && (
          <div className="relative grid grid-cols-2">
            {/* Before */}
            <div className="relative aspect-[3/2] overflow-hidden">
              <Image
                src={`${photoBase}/${story.photoBefore}`}
                alt={`${story.name} — ${t('before')}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 35vw"
              />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-1.5 left-2.5 font-[family-name:var(--font-data)] text-[9px] font-semibold uppercase tracking-widest text-white/90">
                {t('before')}
              </span>
            </div>
            {/* 中线 */}
            <div className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-white/80" />
            {/* After */}
            <div className="relative aspect-[3/2] overflow-hidden">
              <Image
                src={`${photoBase}/${story.photoAfter}`}
                alt={`${story.name} — ${t('after')}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 35vw"
              />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-1.5 right-2.5 font-[family-name:var(--font-data)] text-[9px] font-semibold uppercase tracking-widest text-white/90">
                {t('after')}
              </span>
            </div>
          </div>
        )}

        {/* 人物信息 + 背景 */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 lg:px-6">
          <div className="flex items-start gap-3">
            {/* 无对比照时显示头像 */}
            {!hasComparison && (
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-ukraine-blue-50 to-ukraine-blue-100/60 sm:h-16 sm:w-16">
                {story.photo ? (
                  <Image
                    src={`${photoBase}/${story.photo}`}
                    alt={story.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <User className="h-7 w-7 text-ukraine-blue-300" />
                )}
              </div>
            )}
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-ukraine-blue-900 sm:text-xl">
                {story.name}
              </h3>
              <span className="mt-0.5 inline-block rounded-full bg-ukraine-blue-50 px-2.5 py-px font-[family-name:var(--font-data)] text-[9px] font-semibold uppercase tracking-[0.15em] text-ukraine-blue-500">
                {story.role[locale]}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ukraine-blue-800/85">
            {story.background[locale]}
          </p>
        </div>

        {/* 下半区：故事章节 */}
        <div className="border-t border-ukraine-blue-50 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
          <div className="space-y-4 sm:space-y-5">
            {/* 受伤经历 */}
            {story.injury.length > 0 && (
              <div>
                <h4 className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-gold-600">
                  {t('injuryTitle')}
                </h4>
                <div className="mt-2 space-y-2">
                  {story.injury.map((p, i) => (
                    <p
                      key={i}
                      className="text-sm leading-relaxed text-ukraine-blue-800/80"
                    >
                      {p[locale]}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 康复路径 */}
            {(story.recovery.items.length > 0 || story.recovery.intro) && (
              <div>
                <h4 className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-gold-600">
                  {t('recoveryTitle')}
                </h4>
                <div className="mt-2.5">
                  {story.recovery.intro && (
                    <p className="text-sm leading-relaxed text-ukraine-blue-800/80">
                      {story.recovery.intro[locale]}
                    </p>
                  )}
                  {story.recovery.items.length > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {story.recovery.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-ukraine-blue-800/80"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ukraine-blue-300" />
                          {item[locale]}
                        </li>
                      ))}
                    </ul>
                  )}
                  {story.recovery.outro && (
                    <p className="mt-2 text-sm leading-relaxed text-ukraine-blue-800/80">
                      {story.recovery.outro[locale]}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 结果 */}
            {story.results.length > 0 && (
              <div>
                <h4 className="font-[family-name:var(--font-data)] text-[10px] font-semibold uppercase tracking-[0.2em] text-ukraine-gold-600">
                  {t('resultsTitle')}
                </h4>
                <div className="mt-2 space-y-2">
                  {story.results.map((p, i) => (
                    <p
                      key={i}
                      className="text-sm leading-relaxed text-ukraine-blue-800/80"
                    >
                      {p[locale]}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 引用 */}
          {story.quote && (
            <blockquote className="mt-5 border-l-2 border-ukraine-gold-500 pl-4">
              <p className="font-[family-name:var(--font-accent)] text-base italic leading-relaxed text-ukraine-blue-800">
                &ldquo;{story.quote[locale]}&rdquo;
              </p>
            </blockquote>
          )}
        </div>
      </div>
    </section>
  );
}
