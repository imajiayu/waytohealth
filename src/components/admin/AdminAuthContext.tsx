'use client';

import { createContext, useContext } from 'react';

// Cookie 化之后 Context 只留 signOut；身份由 server cookie 承载，不再通过 React 树传密码。
interface AdminAuth {
  signOut: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuth | null>(null);

export function useAdminAuth(): AdminAuth {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside <AdminShell>');
  }
  return ctx;
}
