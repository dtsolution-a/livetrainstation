'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Image as ImageIcon, Search, Users, ScrollText, UserCircle, LogOut, ExternalLink, Menu, X } from 'lucide-react';
import { api, type AdminUser } from './api';

interface Session { user: AdminUser; permissions: string[] }
interface Auth {
  session: Session;
  can: (perm: string) => boolean;
  refresh: () => Promise<void>;
  setSession: (s: Session) => void;
}
const AuthCtx = createContext<Auth | null>(null);
export const useAuth = () => {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth outside AdminShell');
  return v;
};

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.read' },
  { href: '/admin/posts', label: 'Blog posts', icon: FileText, perm: 'posts.read' },
  { href: '/admin/media', label: 'Media', icon: ImageIcon, perm: 'media.read' },
  { href: '/admin/seo', label: 'SEO & settings', icon: Search, perm: 'seo.read' },
  { href: '/admin/users', label: 'Users & roles', icon: Users, perm: 'users.manage' },
  { href: '/admin/audit', label: 'Activity log', icon: ScrollText, perm: 'audit.read' },
  { href: '/admin/account', label: 'My account', icon: UserCircle, perm: '' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const isLogin = pathname === '/admin/login';

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ user: AdminUser | null; permissions?: string[] }>('/auth/me');
      setSession(r.user ? { user: r.user, permissions: r.permissions || [] } : null);
    } catch {
      setSession(null);
    }
    setReady(true);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, [refresh]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!ready) return;
    if (!session && !isLogin) router.replace('/admin/login');
    else if (session && isLogin) router.replace('/admin');
    else if (session?.user.mustChangePassword && pathname !== '/admin/account') router.replace('/admin/account');
  }, [ready, session, isLogin, pathname, router]);

  if (isLogin) return <div className="a-root">{children}</div>;
  if (!ready || !session) return <div className="a-root a-center"><p className="a-muted">Loading…</p></div>;

  const can = (perm: string) => !perm || session.permissions.includes(perm);
  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setSession(null);
    router.replace('/admin/login');
  };

  return (
    <AuthCtx.Provider value={{ session, can, refresh, setSession }}>
      <div className="a-root a-layout">
        <aside className={`a-side ${open ? 'open' : ''}`}>
          <div className="a-brand"><img src="/images/logo-256.png" alt="" width={26} height={26} style={{ display: 'block' }} />Live Train Station <span>Admin</span></div>
          <nav>
            {NAV.filter((n) => can(n.perm)).map((n) => {
              const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={`a-nav ${active ? 'active' : ''}`}>
                  <n.icon size={17} /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="a-side-foot">
            <a href="/" target="_blank" rel="noopener noreferrer" className="a-nav"><ExternalLink size={17} /> View website</a>
            <button className="a-nav" onClick={logout}><LogOut size={17} /> Sign out</button>
            <p className="a-muted a-small">{session.user.name} · {session.user.role}</p>
          </div>
        </aside>
        <div className="a-main">
          <header className="a-top">
            <button className="a-icon-btn a-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
            <strong>Live Train Station Admin</strong>
          </header>
          <div className="a-content">{children}</div>
        </div>
      </div>
    </AuthCtx.Provider>
  );
}
