'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { href: '/', icon: '💬', labelKey: 'chat' },
  { href: '/assessment', icon: '📋', labelKey: 'assessment' },
  { href: '/tracker', icon: '📊', labelKey: 'tracker' },
  { href: '/journal', icon: '📔', labelKey: 'journal' },
  { href: '/settings', icon: '⚙️', labelKey: 'settings' },
] as const;

export function FooterNav() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors"
              style={{
                color: active ? 'var(--accent)' : 'var(--muted)',
                backgroundColor: active ? 'var(--bg)' : 'transparent',
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.labelKey}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}