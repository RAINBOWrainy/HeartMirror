# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0.0] - 2026-04-20

### Added

- Complete frontend migration from Ant Design to **shadcn/ui + Tailwind CSS** - lighter bundle, better customization, matches organic aesthetic from DESIGN.md
- New UI components: CrisisAlert, EmptyState, ErrorBoundary, GuestModeBanner, LoadingSpinner, Skeletons, NotificationSettings, all shadcn/ui primitives (accordion, alert, avatar, badge, button, card, dialog, dropdown-menu, input, label, progress, select, skeleton, spinner, tabs, textarea, toast, tooltip)
- New pages: Crisis page with crisis hotline information, Intervention page, Profile page, Questionnaire page
- New components: DailyEncouragement, ProgressFeedback, QuickMoodCheckIn (companion features)
- Dashboard: EmotionChart, RiskIndicator, StatCard, TrendChart - complete emotion tracking visualization
- Encryption: AES-GCM encryption for local storage, encrypted storage service
- IndexedDB storage for larger chat/diary data
- Notification system with toast notifications
- New emotion color system matches DESIGN.md specification
- Noto Sans SC typography configured for Chinese-first display
- Local mode filter: restricts local mode authentication to localhost only for security
- Composite database index on `(user_id, created_at)` for EmotionRecord improves dashboard query performance

### Changed

- All existing pages updated to shadcn/ui styling: Chat, Diary, Dashboard, Home, Settings
- Moved from antd icons to Lucide React icons - consistent icon style
- Layout system updated to responsive MainLayout with collapsible sidebar
- Diary tag selection: changed from dropdown to quick-select button grid for better UX
- Local mode default credentials now configurable via environment variables (still has secure defaults)
- Security: local mode now rejects non-localhost connections
- ChatInput: fixed failing tests by updating selectors to match current button text in loading state

### Fixed

- ChatInput: two failing tests updated to match current loading state text
- Multiple missing newlines at end of test files added
- Removed unused imports: Progress from Home.tsx, useNavigate/navigate from Chat.tsx
- Refactored mood color mapping in Diary.tsx from chained ternary to lookup object for better maintainability

### Removed

- Removed all Ant Design dependencies and components
- Removed old public disclaimer HTML file (moved to integrated page)
