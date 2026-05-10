'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CrisisBanner } from '@/components/CrisisSupport';

const navItems = [
  { href: '/', icon: '💬', labelKey: 'chat', labelZh: '聊天' },
  { href: '/assessment', icon: '📋', labelKey: 'assessment', labelZh: '评估' },
  { href: '/tracker', icon: '📊', labelKey: 'dashboard', labelZh: '看板' },
  { href: '/exercises', icon: '🧘', labelKey: 'exercises', labelZh: '训练' },
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

  // Guard: prevent accidental navigation to assessment while composing a message.
  // Shows confirmation if user has typed text in the main chat input.
  const handleAssessmentNav = (e: React.MouseEvent) => {
    const hasInput = typeof window !== 'undefined' && localStorage.getItem('heartmirror-pending-input') === 'true';
    if (hasInput) {
      const confirmed = window.confirm(
        locale === 'zh'
          ? '当前输入尚未发送。确定要离开吗？'
          : 'You have unsent text. Are you sure you want to leave?'
      );
      if (!confirmed) {
        e.preventDefault();
        return;
      }
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
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
        className={`fixed left-0 top-0 bottom-0 z-50 transition-transform duration-200 ease-out border-r flex flex-col`}
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
              // Assessment link gets navigation guard
              if (item.href === '/assessment') {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={handleAssessmentNav}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--accent)' : 'transparent',
                      color: active ? 'white' : 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">
                      {locale === 'zh' ? item.labelZh : item.labelKey}
                    </span>
                  </a>
                );
              }
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

          {/* Crisis Hotline Banner */}
          <CrisisBanner locale={locale as 'zh' | 'en'} />
        </div>
      </aside>
    </>
  );
}