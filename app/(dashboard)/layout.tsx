import { redirect } from 'next/navigation';
import { getAccessToken, decodeJwtPayload } from '@/lib/session';
import { visibleNavItems } from '@/lib/nav-config';
import type { AuthUser } from '@/types';
import { SidebarNav } from './sidebar-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = getAccessToken();
  const user = token ? decodeJwtPayload<AuthUser>(token) : null;

  // Belt-and-suspenders: middleware already redirects on missing cookie,
  // but a malformed/undecodable token should still bounce to login.
  if (!user) redirect('/login');

  const items = visibleNavItems(user.role);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-border bg-muted/40 p-4">
        <div className="mb-6 px-2">
          <p className="text-lg font-semibold">TransitOps</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {user.role.replace('_', ' ')}
          </span>
        </div>
        <SidebarNav items={items} />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
