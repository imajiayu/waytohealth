// 合作伙伴数据类型
export interface Partner {
  id: string;
  logo: string;
  url: string;
  darkBg?: boolean;
}

// 导入并附加类型
import rawPartners from './partners.json';
export const partners: Partner[] = rawPartners;
