'use client';

// Admin 不走 i18n —— 这里用 next/link 和 next/navigation 而非 @/i18n/navigation 是刻意为之
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuthContext } from './AdminAuthContext';

// 加新 tab：追加一行，路径指向 src/app/admin/<feature>/page.tsx
const TABS = [
  { href: '/admin/news', label: 'News' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  // 登录态完全由 server cookie 承载：首次 mount GET /api/admin/me 探活；无 cookie → 显示登录表单
  const [authed, setAuthed] = useState<boolean | null>(null);

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() ?? '/admin';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { credentials: 'same-origin' });
        if (cancelled) return;
        setAuthed(res.ok);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function signOut() {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      /* ignore */
    }
    setAuthed(false);
    setInput('');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pw: input }),
      });
      if (!res.ok) {
        setError('Invalid password or account locked');
        return;
      }
      setInput('');
      setAuthed(true);
    } catch {
      setError('Network error');
    } finally {
      setBusy(false);
    }
  }

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Admin Login</h1>
          <label className="mt-5 block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy || !input}
            className="mt-5 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Verifying…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ signOut }}>
      <nav className="bg-white shadow">
        <div className="container-page">
          <div className="flex h-14 justify-between sm:h-16">
            <div className="flex min-w-0">
              <div className="flex shrink-0 items-center">
                <h1 className="whitespace-nowrap text-base font-bold sm:text-xl">Admin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {TABS.map((tab) => {
                  const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                        active
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={signOut}
                className="hidden text-sm text-gray-700 hover:text-gray-900 sm:block"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:hidden"
                aria-expanded={mobileOpen}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-200 sm:hidden">
            <div className="space-y-1 py-2">
              {TABS.map((tab) => {
                const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block w-full px-4 py-2.5 text-sm font-medium ${
                      active
                        ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
              <div className="mt-1 border-t border-gray-200 pt-1">
                <button
                  type="button"
                  onClick={signOut}
                  className="block w-full border-l-4 border-transparent px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="container-page py-4 sm:py-6">{children}</main>
    </AdminAuthContext.Provider>
  );
}
