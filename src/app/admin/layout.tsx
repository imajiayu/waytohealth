import type { Metadata } from 'next';
import { fontVariables } from '@/app/fonts';
import AdminShell from '@/components/admin/AdminShell';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Admin — Way to Health',
  robots: { index: false, follow: false },
};

/**
 * Admin 后台根 layout — 不走 i18n，全英文。
 *
 * 新增 admin 功能的步骤（便于后续扩展）：
 * 1. 在 src/components/admin/ 新建 <FeatureName>Panel.tsx（用 useAdminAuth() 拿密码）
 * 2. 在 src/app/admin/<feature>/page.tsx 里引用 Panel
 * 3. 在 src/components/admin/AdminShell.tsx 的 TABS 数组加一行
 *
 * 登录态、顶部 bar、tabs 导航已由 AdminShell 统一管理，无需重复实现。
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 font-[family-name:var(--font-body)]">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
