'use client';

import { createContext, useContext } from 'react';

interface AdminAuth {
  pw: string;
  signOut: () => void;
}

export const AdminAuthContext = createContext<AdminAuth | null>(null);

export function useAdminAuth(): AdminAuth {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside <AdminShell>');
  }
  return ctx;
}
