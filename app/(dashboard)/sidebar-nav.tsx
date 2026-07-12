'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { NavItem } from '@/lib/nav-config';

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="mt-4 rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
      >
        Log out
      </button>
    </nav>
  );
}
