'use client';

import { type Locale } from '@/i18n/config';
import { type PatientStory } from '@/data/projects';
import { useTranslations } from 'next-intl';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { User } from 'lucide-react';
import Image from 'next/image';

interface Props {
  story: PatientStory;
  index: number;
  locale: Locale;
  projectId: number;
}

export default function PatientStoryCard({ story, index, locale, projectId }: Props) {
  const t = useTranslations('projectDetail');
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>();
  const number = String(index + 1).padStart(2, '0');
  const hasComparison = story.photoBefore && story.photoAfter;
  const photoBase = `/data/projects/${projectId}`;

  return (
    <div
      ref={ref}
      className="relative flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ukraine-blue-100/50 bg-white/85 shadow-[0_1px_12px_rgba(0,108,178,0.05)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_4px_24px_rgba(0,108,178,0.09)] sm:w-[340px] opacity-0"
      style={{
        animation: isVisible
          ? `detail-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.1}s forwards`
          : 'none',
      }}
    >
      {/* 顶部品牌渐变条 */}
      <div className="h-1 gradient-brand-line" />

      {/* ── Before / After 对比照片 ── */}
      {hasComparison && (
        <div className="relative grid grid-cols-2">
          {/* Before */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={`${photoBase}/${story.photoBefore}`}
              alt={`${story.name} — ${t('before')}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 150px, 170px"
            />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-1.5 left-2 font-[family-name:var(--font-data)] text-[9px] font-semibold uppercase tracking-widest text-white/90">
              {t('before')}
            </span>
          </div>
          {/* 中线分隔 */}
          <div className="absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-white" />
          {/* After */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={`${photoBase}/${story.photoAfter}`}
              alt={`${story.name} — ${t('after')}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 150px, 170px"
            />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-1.5 right-2 font-[family-name:var(--font-data)] text-[9px] font-semibold uppercase tracking-widest text-white/90">
              {t('after')}
            </span>
          </div>
        </div>
      )}

      {/* ── 头部：姓名 + 角色 + 编号 ── */}
      <div className="relative flex items-center gap-3 px-5 pt-4">
        {/* 头像（无对比照时作为视觉锚点） */}
        {!hasComparison && (
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-ukraine-blue-50 to-ukraine-blue-100/60">
            {story.photo ? (
              <Image
                src={`${photoBase}/${story.photo}`}
                alt={story.name}
                fill
                className="object-cover"
                sizes="44px"
              />
            ) : (
              <User className="h-5 w-5 text-ukraine-blue-300" />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-ukraine-blue-900 sm:text-lg">
            {story.name}
          </h3>
          <span className="inline-block rounded-full bg-ukraine-blue-50 px-2 py-px font-[family-name:var(--font-data)] text-[9px] font-semibold uppercase tracking-[0.15em] text-ukraine-blue-500">
            {story.role[locale]}
          </span>
        </div>
        {/* 编号水印 */}
        <span className="font-[family-name:var(--font-data)] text-3xl font-black leading-none text-ukraine-blue-50 sm:text-4xl">
          {number}
        </span>
      </div>

      {/* ── 背景摘要 ── */}
      <p className="mt-2.5 px-5 line-clamp-3 text-[0.8125rem] leading-relaxed text-ukraine-blue-800/75">
        {story.background[locale]}
      </p>

      {/* ── 受伤经历（首段摘要） ── */}
      {story.injury.length > 0 && (
        <div className="mt-3 px-5">
          <h4 className="font-[family-name:var(--font-data)] text-[9px] font-semibold uppercase tracking-[0.2em] text-ukraine-gold-600">
            {t('injuryTitle')}
          </h4>
          <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-ukraine-blue-800/70">
            {story.injury[0][locale]}
          </p>
        </div>
      )}

      {/* ── 康复方案（标签化 / 摘要） ── */}
      {(story.recovery.items.length > 0 || story.recovery.intro) && (
        <div className="mt-3 px-5">
          <h4 className="font-[family-name:var(--font-data)] text-[9px] font-semibold uppercase tracking-[0.2em] text-ukraine-gold-600">
            {t('recoveryTitle')}
          </h4>
          {story.recovery.items.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {story.recovery.items.slice(0, 4).map((item, i) => (
                <span
                  key={i}
                  className="rounded bg-ukraine-blue-50/80 px-1.5 py-0.5 text-[10px] leading-snug text-ukraine-blue-600"
                >
                  {item[locale]}
                </span>
              ))}
              {story.recovery.items.length > 4 && (
                <span className="rounded bg-ukraine-gold-50 px-1.5 py-0.5 text-[10px] leading-snug text-ukraine-gold-600">
                  +{story.recovery.items.length - 4}
                </span>
              )}
            </div>
          ) : story.recovery.intro ? (
            <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-ukraine-blue-800/70">
              {story.recovery.intro[locale]}
            </p>
          ) : null}
        </div>
      )}

      {/* ── 结果（首段摘要） ── */}
      {story.results.length > 0 && (
        <div className="mt-3 px-5">
          <h4 className="font-[family-name:var(--font-data)] text-[9px] font-semibold uppercase tracking-[0.2em] text-ukraine-gold-600">
            {t('resultsTitle')}
          </h4>
          <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-ukraine-blue-800/70">
            {story.results[0][locale]}
          </p>
        </div>
      )}

      {/* ── 引用 ── */}
      {story.quote ? (
        <div className="mt-auto pt-3">
          <div className="border-t border-ukraine-blue-50 px-5 py-3.5">
            <div className="relative pl-3">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-ukraine-gold-500" />
              <p className="line-clamp-3 font-[family-name:var(--font-accent)] text-[0.8125rem] italic leading-relaxed text-ukraine-blue-800/85">
                &ldquo;{story.quote[locale]}&rdquo;
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="pb-5" />
      )}
    </div>
  );
}
