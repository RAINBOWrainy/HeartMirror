import '@testing-library/jest-dom/vitest';
import { expect, vi } from 'vitest';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertive<T = unknown>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next/font
vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter',
  }),
}));
