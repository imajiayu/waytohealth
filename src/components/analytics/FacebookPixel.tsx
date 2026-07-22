'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { FB_PIXEL_ID, pageview } from '@/lib/fbpixel';

// Meta Pixel 加载器：按基金会规格无条件注入 fbevents.js。
// 首帧 PageView 由 base code 触发；SPA 路由切换由 pathname effect 补发（跳过首次防重复计数）。
// 只用 usePathname 不用 useSearchParams —— 后者触发 CSR bailout 会破坏 layout 静态渲染。
export default function FacebookPixel() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // 首帧的 PageView 由 base code 的 fbq('track','PageView') 覆盖，这里只记基线不补发。
    // 用「上一次 pathname」判断而非布尔 firstRun —— 后者在 dev 的 StrictMode 双调用
    // （mount→cleanup→mount，ref 值保留）下会被绕过，导致首帧多打一次 PageView。
    if (lastPath.current === null) {
      lastPath.current = pathname;
      return;
    }
    if (lastPath.current === pathname) return; // StrictMode 重复调用 / 同路径重渲染
    lastPath.current = pathname;
    pageview();
  }, [pathname]);

  return (
    <Script id="fb-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FB_PIXEL_ID}');
      fbq('track', 'PageView');`}
    </Script>
  );
}
