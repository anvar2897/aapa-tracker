'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, LayoutDashboard, ClipboardList, Upload } from 'lucide-react';

const navItems = [
  { href: '/products', icon: Package, label: 'Товары' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { href: '/audit', icon: ClipboardList, label: 'Аудит' },
  { href: '/import', icon: Upload, label: 'Импорт' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-56 shrink-0 min-h-screen border-r"
      style={{
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 border-b"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono text-amber-400 tracking-tight">
            AAPA
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
            tracker
          </span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: 'hsl(215 20% 40%)' }}>
          Uzum Marketplace
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                active ? 'text-amber-400' : 'hover:text-gray-200'
              }`}
              style={
                active
                  ? {
                      backgroundColor: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.15)',
                    }
                  : {
                      color: 'hsl(215 20% 55%)',
                    }
              }
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              <span className={active ? 'font-medium' : ''}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4 border-t"
        style={{
          borderColor: 'var(--sidebar-border)',
          color: 'var(--sidebar-foreground)',
        }}
      >
        <p className="text-[10px] font-mono">v0.1.0 · SQLite</p>
      </div>
    </aside>
  );
}
