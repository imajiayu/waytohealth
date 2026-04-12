// 合作伙伴数据类型
export interface Partner {
  id: string;
  logo: string;
  /** 官网链接；省略时渲染为非可点击的 logo（暂未公开/无独立官网） */
  url?: string;
}

// 导入并附加类型
import rawPartners from './partners.json';
export const partners: Partner[] = rawPartners;
