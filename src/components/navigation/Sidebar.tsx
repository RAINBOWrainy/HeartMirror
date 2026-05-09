'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: '💬', labelKey: 'chat', labelZh: '聊天' },
  { href: '/assessment', icon: '📋', labelKey: 'assessment', labelZh: '评估' },
  { href: '/tracker', icon: '📊', labelKey: 'dashboard', labelZh: '看板' },
  { href: '/journal', icon: '📔', labelKey: 'journal', labelZh: '日记' },
  { href: '/settings', icon: '⚙️', labelKey: 'settings', labelZh: '设置' },
] as const;

interface SidebarProps {
  locale?: string;
}

export function Sidebar({ locale = 'zh' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors"
        style={{
          backgroundColor: 'var(--surface)',
          color: 'var(--text)',
          borderColor: 'var(--border)',
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      {/* Overlay when closed */}
      {!isOpen && (
        <div
          className="fixed left-0 top-0 bottom-0 w-12 z-40"
          onClick={() => setIsOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 transition-transform duration-200 ease-out border-r`}
        style={{
          width: isOpen ? '200px' : '0',
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          overflow: 'hidden',
        }}
      >
        <div className="flex flex-col h-full w-[200px]">
          {/* Logo/Brand */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              HeartMirror
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '心理健康助手' : 'Mental Health Companion'}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'white' : 'var(--text)',
                  }}
                  onClick={() => {
                    // Auto-close on mobile if needed
                    if (window.innerWidth < 768) {
                      setIsOpen(false);
                    }
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">
                    {locale === 'zh' ? item.labelZh : item.labelKey}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '不能替代专业医疗' : 'Not a substitute for professional care'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}