# TODO: HeartMirror

This file tracks deferred features and future improvements. Items are ordered by priority — higher = more important.

## P1 - High Priority

### ✅ Multiple conversation threads (COMPLETED)
- Full CRUD flow implemented and working
- Sidebar with create/load/delete conversation
- Encrypted preview metadata for fast list loading
- Two-phase migration system

### ✅ Tauri desktop app packaging (COMPLETED)
- Full Rust backend with SQLite database
- AES-256-GCM encryption in Rust
- Chat API via Rust reqwest client
- Dual-mode client abstraction (browser + Tauri
- GitHub Actions CI configured

### Cloud mode implementation
- **Why:** Allows non-technical users to use HeartMirror without self-hosting. Data is still end-to-end encrypted on the server.
- **Current state:** Directory scaffolding and Prisma schema done, just need to implement the feature modules.
- **Effort:** M (about 1-2 hours)

## P2 - Medium Priority

### Mood tracking / analytics dashboard
- **Why:** Helps users spot patterns (when do they spiral the most? what topics come up repeatedly?)
- **Current state:** Not started. Would add a simple mood rating prompt after each conversation and a calendar/history view showing trends.
- **Effort:** L (about 2 hours)

### User settings page
- **Why:** Currently settings are only in the modal on the main page. A dedicated settings page would allow for more configuration options.
- **Current state:** Not started.
- **Effort:** S (about 30 minutes)

### Prompt fine-tuning UI
- **Why:** Allows users to customize the system prompt for their needs.
- **Current state:** Not started. Prompt is hard-coded in `src/features/ai/shared/prompt-engineering.ts`.
- **Effort:** S (about 30 minutes)

### Mobile push notifications
- **Why:** For PWA installed on home screen, could remind users to check in if they've been spiraling frequently.
- **Current state:** Not started.
- **Effort:** L (requires service worker updates, permissions handling)

## Done / Completed

- ✓ PWA support
- ✓ Enter to send / Shift+Enter for newlines
- ✓ Word-by-word streaming animation
- ✓ Clear all conversations button
- ✓ Markdown rendering in AI responses
- ✓ Copy to clipboard for individual messages
- ✓ Password protection for local mode
- ✓ API key configuration UI with all provider presets
- ✓ Conversation export/import for migration
- ✓ Crisis detection and hotline information
- ✓ Ollama local LLM support
- ✓ Prominent legal disclaimer
- ✓ Support for all OpenAI-compatible AI providers
- ✓ Add LICENSE file
- ✓ Create TODOS.md
