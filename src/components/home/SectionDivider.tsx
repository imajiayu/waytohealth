/**
 * 首页 section 之间的过渡分隔带
 * 中央金色短线 + 6 个水平排列的圆点(中间一颗描边金点强调)
 * 用于柔化白底 section 之间的边界,营造编辑式节奏
 */
export default function SectionDivider() {
  return (
    <div className="section-divider" aria-hidden="true">
      <span className="section-divider__dot" />
      <span className="section-divider__dot" />
      <span className="section-divider__line" />
      <span className="section-divider__dot section-divider__dot--gold" />
      <span className="section-divider__line" />
      <span className="section-divider__dot" />
      <span className="section-divider__dot" />
    </div>
  );
}
