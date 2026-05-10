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
- **Current state:** Substantially addressed by CEO plan accepted scope (Proposals 1-4: Unified Timeline, Pattern Engine, Insight Digest). Remaining: analytics-specific visualizations.
- **Effort:** L (about 2 hours)
- **Related:** See CEO plan `~/.gstack/projects/HeartMirror/ceo-plans/2026-05-10-tracking-expansion.md`

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
- **Current state:** Partially addressed by CEO plan Proposal 3 (Proactive Check-In Nudges). VAPID key script needed.
- **Effort:** L (requires service worker updates, permissions handling)

### Pattern Engine LLM prompt template
- **Why:** Isolates the LLM instruction from the API route code. Without a documented prompt template, Pattern Engine behavior drifts as the LLM API evolves.
- **Current state:** Not started. Create `src/features/ai/shared/pattern-prompt.ts` with system prompt and Zod output schema.
- **Effort:** S (~10min with CC)
- **Related:** CEO plan Phase 2 — Pattern Intelligence Engine

### Push notification VAPID key pair generation script
- **Why:** VAPID keys are required for Web Push Protocol. No standard way to generate them in Node without a library.
- **Current state:** Not started. Create `scripts/generate-vapid-keys.ts`.
- **Effort:** S (~10min with CC)
- **Related:** CEO plan Phase 6 — Proactive Check-In Nudges

### Long-press gesture detection hook
- **Why:** Required for "long-press assessment button for 2-question quick check" (CEO plan delight item 4). Currently no long-press handling in codebase.
- **Current state:** Not started. Implement `useLongPress` hook (500ms threshold).
- **Effort:** S (~10min with CC)
- **Related:** CEO plan Phase 1 — Delight items

### "/mood" slash command
- **Why:** Support both "mood 6" (free text) and "/mood 6" (explicit slash command) for more discoverable, unambiguous mood logging.
- **Current state:** Not started. Extend chat input parser.
- **Effort:** S (~10min with CC)
- **Related:** CEO plan Phase 4 — Chat-to-Tracker Integration

## P3 - Lower Priority

### Exercise recommendation rule data structure
- **Why:** Refactor `exercises/page.tsx` to use a data-driven rules array instead of hardcoded if/else chains. Prevents silent breakage when exercises change.
- **Current state:** Not started.
- **Effort:** S (~20min with CC)

### Pattern cache eviction policy
- **Why:** Add `maxAge` check so stale cache (>7 days) triggers re-analysis instead of showing old patterns.
- **Current state:** Pattern cache has 24hr TTL but no upper bound. User absent 2+ months sees stale data.
- **Effort:** S (~5min with CC)

### Weekly digest pre-computation (cloud mode)
- **Why:** Pre-compute and store the weekly digest so returning users see it instantly instead of waiting 2-3s for LLM call.
- **Current state:** Not started. On-demand generation works fine for v1.
- **Effort:** M (~30min with CC)
- **Note:** Premature until user scale justifies it. Revisit when DAU > 1000.

### Insight Digest interaction analytics
- **Why:** Track which patterns users expand vs. ignore to close the feedback loop on pattern quality. Feeds prompt improvement.
- **Current state:** Not started. No feedback loop exists.
- **Effort:** S (~20min with CC)

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
