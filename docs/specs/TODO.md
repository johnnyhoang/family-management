# Technical Backlog & Code Quality Roadmap

Issues found during code review on 2026-04-30. Grouped by priority.

---

## CRITICAL (P0) — Fix before production traffic

### P0-1: Notification scheduling uses in-process setTimeout
- **File**: `server/src/modules/notification/notification.service.ts`
- **Problem**: `scheduleNotification()` uses `setTimeout` — jobs are lost on process restart. On Vercel (serverless), every cold start loses all scheduled jobs.
- **Fix**: Replace with BullMQ + Redis, or use DB-backed polling via a Cron job that checks `scheduledAt <= now`.
- **Note**: The Cron-based approach (checking due dates) already exists in `maintenance.scheduler.ts` — extend that pattern instead.

### P0-2: No test coverage
- **File**: `server/src/` (entire backend)
- **Problem**: Only 1 placeholder spec (`app.controller.spec.ts`). No tests for RBAC, auth flow, multi-tenancy isolation, or AI parsing.
- **Fix**: Add integration tests for: `PermissionGuard`, `AuthService.validateOAuthUser`, `ExpenseService.create` (recurring cycle), `AssetService` multi-tenancy isolation.

---

## HIGH (P1) — Fix before scaling

### P1-1: DB migration required for new indexes
- **Files**: `asset.entity.ts`, `expense.entity.ts`, `user.entity.ts`
- **Problem**: `@Index` decorators were added but no migration file was generated. Running with `DB_SYNCHRONIZE=false` means indexes won't be applied.
- **Fix**: Run `typeorm migration:generate` to create the migration, commit it, and apply on next deploy.
- **Command**: `cd server && npx typeorm migration:generate src/migrations/AddFamilyIndexes -d src/data-source.ts`

### P1-2: parse() method saves wrong userId to history
- **File**: `server/src/modules/natural-input/natural-input.service.ts:50`
- **Problem**: `parse()` (the old method) uses a hacky fallback `context.familyMembers.find(...)` to get a userId — it always resolves to the first family member, not the actual caller. `parseWithUser()` is the correct method but `parse()` is still callable.
- **Fix**: Deprecate `parse()` entirely, or add a `userId` parameter to it. Ensure all controller routes call `parseWithUser()`.

### P1-3: Auth creates "Default Family" for every new user — all users share one family
- **File**: `server/src/modules/auth/auth.service.ts:51`
- **Problem**: All new users join the same "Default Family" because `findOne({ where: { name: 'Default Family' } })` finds the existing one. New users should get their own family.
- **Fix**: Create a new Family for every new user. If invitation flow exists, link to the inviting family instead.

### P1-4: LIKE search is case-sensitive on PostgreSQL
- **File**: `server/src/modules/asset/asset.service.ts:27`
- **Problem**: `LIKE :search` is case-sensitive in PostgreSQL. Searching "xe" won't find "Xe".
- **Fix**: Use `ILIKE` instead of `LIKE` for PostgreSQL, or `LOWER(asset.name) LIKE LOWER(:search)`.

---

## MEDIUM (P2) — Code quality / UX

### P2-1: OpenAI model hardcoded
- **File**: `server/src/modules/natural-input/natural-input.service.ts:269`
- **Problem**: `model: 'gpt-4o-mini'` is hardcoded. Upgrading the model requires a code change.
- **Fix**: Read from `ConfigService`: `this.configService.get('OPENAI_MODEL', 'gpt-4o-mini')`.

### P2-2: Dashboard warranty window hardcoded
- **File**: `server/src/modules/dashboard/dashboard.service.ts`
- **Problem**: "+30 days" for warranty expiration window is hardcoded.
- **Fix**: Make it a config value or query param.

### P2-3: SpeechRecognition API lacks fallback
- **File**: `web/src/components/NaturalInputBox.tsx`
- **Problem**: Voice input silently fails if browser doesn't support `webkitSpeechRecognition` (e.g., Firefox). No user feedback.
- **Fix**: Check `'SpeechRecognition' in window || 'webkitSpeechRecognition' in window` on mount; hide or disable the mic button if unsupported.

### P2-4: No avatarUrl in auth profile
- **File**: `server/src/modules/auth/auth.service.ts`
- **Problem**: `OAuthProfile` interface doesn't include `avatarUrl`, so Google profile pictures are never saved on first login.
- **Fix**: Add `avatarUrl?: string` to `OAuthProfile`, pass it from `GoogleStrategy`, and save to `user.avatarUrl`.

### P2-5: JWT expires_in type cast with `as any`
- **File**: `server/src/modules/auth/auth.module.ts:30`
- **Problem**: `configService.get<string>('JWT_EXPIRES_IN') as any` — unnecessary cast.
- **Fix**: Use `expiresIn: configService.get('JWT_EXPIRES_IN') || '7d'`.

### P2-6: Expense CSV export uses dynamic import
- **File**: `server/src/modules/expense/expense.service.ts:101`
- **Problem**: `await import('csv-stringify/sync')` is a dynamic import inside a method — runs on every export call.
- **Fix**: Import statically at the top: `import { stringify } from 'csv-stringify/sync'` (same fix for `asset.service.ts`).

---

## LOW (P3) — Nice to have

### P3-1: No Docker/Docker Compose for local dev
- **Problem**: AI_HANDOVER.md references Docker but no Dockerfile exists. Local dev requires manual PostgreSQL setup.
- **Fix**: Add `docker-compose.yml` with PostgreSQL + pgAdmin for local development.

### P3-2: Missing .env description comments
- **File**: `server/.env.example`
- **Problem**: Environment variables have no inline comments explaining their purpose or expected format.
- **Fix**: Add `# comment` annotations to each variable.

### P3-3: NaturalInputHistory `userId` is not a FK relation
- **File**: `server/src/modules/natural-input/entities/natural-input-history.entity.ts`
- **Problem**: `userId` is likely stored as a plain string without a FK to `users` table. The `relations: ['user']` in `getHistory()` implies a ManyToOne relation exists, but worth verifying it's defined correctly.
- **Fix**: Verify entity has `@ManyToOne(() => User) user: User` with proper JoinColumn.

### P3-4: No loading/error state for Dashboard stats
- **File**: `web/src/pages/Dashboard.tsx`
- **Problem**: No error boundary or error state for failed `/dashboard/stats` query. App shows blank content on API failure.
- **Fix**: Add `isError` handling with a user-friendly message.

---

## DONE (completed 2026-04-30)
- ✅ Replace `console.log` with NestJS `Logger` in auth, permission guard, natural-input, notification services
- ✅ Add `@Index` on `familyId`, `(familyId, status)`, `(familyId, warrantyExpiredAt)` for assets; `familyId`, `(familyId, expenseDate)` for expenses; `familyId` for users; `familyId`, `(familyId, userId)` for notifications
- ✅ Migration `1745971200000-AddIndexesAvatarAndScheduledAt` created for all index + column changes
- ✅ Extract duplicate `computeNextOccurrence()` in `expense.service.ts`; remove `as any` enum casts
- ✅ Wrap family+user creation in `dataSource.transaction()` in `auth.service.ts`
- ✅ Fix auth: each new user now creates their own unique family (was sharing "Default Family")
- ✅ Fix `scheduleNotification`: replaced `setTimeout` with DB-based `scheduledAt` column; `findAll` filters to only show due notifications — survives Vercel cold starts
- ✅ Remove dead `parse()` method from `natural-input.service.ts`; controller already calls `parseWithUser()`
- ✅ Fix asset search `LIKE` → `ILIKE` (PostgreSQL case-insensitive)
- ✅ Save `avatarUrl` from Google OAuth profile to users table; added `avatarUrl` to `User` entity and `generateToken` response
- ✅ Fix Google strategy: properly typed with `Profile` from passport-google-oauth20; added `avatarUrl` and null-safe name concatenation
- ✅ Fix JWT `expiresIn as any` → `|| '7d'` fallback in `auth.module.ts`
- ✅ Replace dynamic `await import('csv-stringify/sync')` with static imports in `asset.service.ts` and `expense.service.ts`
- ✅ Read `OPENAI_MODEL` from config (defaults to `gpt-4o-mini`)
- ✅ Revoke blob URL after CSV download in `AssetList.tsx`
- ✅ Type `OAuthProfile` interface in `auth.service.ts` (remove `profile: any`)
- ✅ Type `contextCache` with `ContextCacheEntry` interface in `natural-input.service.ts`
- ✅ Type `getSystemPrompt` context parameter; `parseAssistantJson` return type; `fillAmountFromUserText` parameter
- ✅ Replace `filters: any` with typed interface in `AssetList.tsx`
- ✅ Fix redundant `UserRole.SYSTEM_ADMIN || 'SYSTEM_ADMIN'` string literal checks in `permission.guard.ts`
- ✅ `customFields: any` → `Record<string, unknown>` in asset and expense entities; `metadata: any` → `Record<string, unknown>` in notification entity
- ✅ Updated `REQUIREMENTS.md` to reflect actual tech stack (PostgreSQL/Vercel, not MySQL/Cloud Run)
- ✅ Updated `AI_HANDOVER.md` with accurate stack table, env var docs, link to TODO.md
- ✅ Created `docs/specs/ARCHITECTURE.md` with full system diagram, DB schema, RBAC flow
- ✅ Cleaned up `server/.env.example`: removed duplicate key, removed real credentials, added `OPENAI_MODEL` doc
