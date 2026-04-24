import Image from 'next/image';

type TeamMember = {
  name: string;
  role: string;
  image?: string;
};

type Props = {
  members: TeamMember[];
  /** 无照片成员的占位标签 */
  noPortraitLabel: string;
};

/**
 * 杂志拼贴风格的团队展示
 * - CSS columns 多列布局，自动平衡分布
 * - 照片严格保持原始 2:3 比例（3648×5472），不裁剪
 * - 引言卡片用更矮的比例制造视觉错落
 */
export default function TeamCollage({ members, noPortraitLabel }: Props) {
  return (
    <div className="columns-2 gap-3 sm:columns-2 sm:gap-5 lg:columns-3 lg:gap-7">
      {members.map((member) => {
        return (
          <figure
            key={member.name}
            className="group relative mb-3 break-inside-avoid sm:mb-5 lg:mb-7"
          >
            {member.image ? (
              // 照片成员 ── 严格 2:3 保持原比例
              <div className="relative w-full overflow-hidden rounded-[4px] bg-ukraine-blue-50 ring-1 ring-ukraine-blue-100">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={3648}
                  height={5472}
                  className="block h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* 底部渐变 + 名字铭牌 */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ukraine-blue-900/80 via-ukraine-blue-900/30 to-transparent pt-10 sm:pt-16">
                  <figcaption className="p-2.5 text-white sm:p-5">
                    <p className="font-[family-name:var(--font-display)] text-[13px] font-semibold leading-tight tracking-tight sm:text-xl">
                      {member.name}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/85 sm:mt-1 sm:text-[13px] sm:tracking-[0.18em]">
                      {member.role}
                    </p>
                  </figcaption>
                </div>
              </div>
            ) : (
              // 无照片成员 ── 引言式金色印章卡片，aspect 不同制造错落
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[4px] bg-gradient-to-br from-ukraine-gold-50 via-white to-ukraine-blue-50 ring-1 ring-ukraine-gold-300/60 sm:aspect-[5/4]">
                {/* 装饰描边 */}
                <div className="pointer-events-none absolute inset-2 rounded-[3px] border border-ukraine-gold-400/40 sm:inset-3" />

                <div className="relative flex h-full flex-col justify-between p-3 sm:p-7">
                  <div className="flex items-start justify-between">
                    <svg viewBox="0 0 32 32" className="h-5 w-5 text-ukraine-gold-500 sm:h-7 sm:w-7" fill="currentColor">
                      <path d="M9 9c-3 0-5 2-5 5s2 5 5 5h1l-2 6h6l3-9V9H9zm14 0c-3 0-5 2-5 5s2 5 5 5h1l-2 6h6l3-9V9h-8z" />
                    </svg>
                    <span className="font-[family-name:var(--font-data)] text-[8px] font-medium uppercase tracking-[0.18em] text-ukraine-blue-400 sm:text-[9px] sm:tracking-[0.22em]">
                      {noPortraitLabel}
                    </span>
                  </div>

                  <div>
                    <div
                      className="font-[family-name:var(--font-display)] text-[3rem] font-medium leading-[0.8] tracking-tight text-ukraine-blue-900/12 sm:text-[6.5rem]"
                      aria-hidden="true"
                    >
                      {member.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-[13px] font-semibold tracking-tight text-ukraine-blue-900 sm:mt-3 sm:text-xl">
                      {member.name}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-ukraine-blue-500/80 sm:mt-1 sm:text-[13px] sm:tracking-[0.18em]">
                      {member.role}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </figure>
        );
      })}
    </div>
  );
}
