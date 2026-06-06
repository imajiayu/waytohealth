import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.68.*'],
  // www → apex 永久跳转。生产 www.waytohealth.org.ua 直接返回 200（未跳转），
  // 而 canonical/hreflang 都指向 apex，导致 Lighthouse 判 canonical 无效 + 搜索引擎重复内容。
  // 用 host 匹配做 308 永久跳转，把 www 流量收敛到主域。
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.waytohealth.org.ua' }],
        destination: 'https://waytohealth.org.ua/:path*',
        permanent: true,
      },
    ];
  },
  experimental: {
    // 把 Tailwind 生成的 CSS（~22 KiB）inline 进 HTML，消除 PageSpeed 标的
    // "渲染屏蔽请求 670ms"。CSS 小且每路由共享，inline 后 LCP/FCP 显著提前
    inlineCss: true,
  },
  images: {
    // 允许 next/image 加载本地 SVG（partners logo 使用）
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        // Vercel Blob（news 图片）
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
