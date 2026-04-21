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

export const ptSerif = PT_Serif({
  variable: '--font-accent',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
});

export const jetbrainsMono = JetBrains_Mono({
  variable: '--font-data',
  subsets: ['latin', 'cyrillic'],
});

export const fontVariables = `${fixelText.variable} ${ptSerif.variable} ${jetbrainsMono.variable}`;
