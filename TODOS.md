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
- **Why:** Allows non-technical users to use HeartMirror without self-hosting. Data is still end-to-end encrypted on the server. Zero-knowledge architecture - server never sees passwords or plaintext conversations.
- **Current state:** Architecture fully designed, ready for implementation. See `~/.gstack/projects/HeartMirror/rainbow-cloud-design-20260423.md`
- **Effort:** M (about 5 hours total, broken down below)
- **Priority:** NEXT

### Cloud Mode Task Breakdown

#### 1. Database Schema + Migrations
- Add PostgreSQL datasource alongside SQLite in `prisma/schema.prisma`
- Add User model with encrypted DEK container fields
- Add RLS policy raw SQL migration
- Add conversation foreign key + cascade delete
- **Effort:** 30min

#### 2. Next.js Middleware Auth
- Create `src/middleware.ts` - single enforcement point for ALL routes
- RS256 JWT verification with public key
- Route whitelist: /api/auth/*, static assets
- Inject userId into request headers for downstream handlers
- **Effort:** 20min

#### 3. Auth API Endpoint
- Create `src/app/api/auth/[action]/route.ts` (login, signup, forgot, reset)
- Client-side PBKDF2 (600k iterations) in Web Worker
- Timing-safe password verification using existing crypto primitives
- Email verification + password reset with Resend
- 7-day JWT expiration, RS256 signed
- **Effort:** 45min

#### 4. RLS-Enabled Database Client
- Create `src/features/database/cloud.ts`
- Prisma Client with RLS row-level security enabled
- Multi-tenant query wrapper (auto-adds userId filter)
- Conversation CRUD with RLS enforcement tests
- **Effort:** 30min

#### 5. Client-Side Crypto Library
- Create `src/lib/crypto/client.ts`
- PBKDF2 key derivation (600k iterations) in Web Worker
- AES-256-GCM encryption/decryption of conversations before API send
- DEK/KEK container handling
- Memory zeroization best-effort (document JS limitations)
- **Effort:** 45min

#### 6. API Key Header Migration
- Move `apiKey` from request body to `Authorization: Bearer <key>` header
- Update all existing API routes to read from header instead of body
- Update frontend chat API client
- **Critical:** Vercel automatically redacts Authorization headers from logs
- **Effort:** 10min

#### 7. Mode Switch + Migration Wizard
- Auto-detect mode based on environment (local build → local mode, deployed → cloud mode)
- No explicit toggle - prevents accidental data loss
- Migration wizard on first cloud login: "Import your local conversations?"
- One-click local → cloud migration using existing import/export format
- **Effort:** 60min

#### 8. Rate Limiting with Upstash Redis
- Login endpoint: 5 requests/minute per IP
- Chat endpoint: 60 requests/minute per user
- Password reset: 1 request/15 minutes per email
- Fail-open gracefully if Redis is temporarily down
- **Effort:** 30min

#### 9. Test Infrastructure
- Add PostgreSQL Testcontainer to `vitest.config.ts`
- Add PostgreSQL service to CI workflow
- RLS enforcement tests (user A cannot access user B data)
- Middleware auth tests
- Client-side crypto tests
- Import/export migration tests
- **Effort:** 60min

#### 10. Documentation + Environment Setup
- Update README with cloud mode architecture
- Document environment variables needed
- Generate RS256 key pair instructions
- Update deployment guide
- **Effort:** 30min

**Total Cloud Mode Effort:** ~5 hours / ~30 minutes with Claude Code

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
