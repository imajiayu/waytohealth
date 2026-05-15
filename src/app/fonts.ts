import localFont from 'next/font/local';
import { PT_Serif, JetBrains_Mono } from 'next/font/google';

// 主字体: Fixel Text — MacPaw 开源乌克兰字体
// 仅保留实际在用的 4 个权重（删 ExtraBold，正文/标题已在 Bold 上封顶）
export const fixelText = localFont({
  src: [
    { path: '../../public/fonts/fixel/FixelText-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/fixel/FixelText-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/fixel/FixelText-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/fixel/FixelText-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
});

// PT_Serif / JetBrains_Mono 只在装饰性位置（accent 标题、数字标签）用，
// 首页 fold 内不出现 —— 关 preload 把它们从关键渲染路径移走（PageSpeed 测得字体
// woff2 链长 1393ms 主要源于此），首次绘制走 fallback，加载完成后再 swap 上
export const ptSerif = PT_Serif({
  variable: '--font-accent',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  preload: false,
});

export const jetbrainsMono = JetBrains_Mono({
  variable: '--font-data',
  subsets: ['latin', 'cyrillic'],
  preload: false,
});

export const fontVariables = `${fixelText.variable} ${ptSerif.variable} ${jetbrainsMono.variable}`;
