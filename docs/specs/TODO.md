# Technical Backlog & Code Quality Roadmap

Issues found during code review on 2026-04-30. Grouped by priority.

---

## CRITICAL (P0) — Fix before production traffic

### ~~P0-1~~: ✅ DONE — Notification scheduling uses in-process setTimeout
- Replaced `setTimeout` with DB `scheduledAt` column; Cron-based surfacing via `MaintenanceScheduler`.

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

### ~~P1-2~~: ✅ DONE — parse() method saves wrong userId to history
- Dead `parse()` method removed; all routes call `parseWithUser()`.

### ~~P1-3~~: ✅ DONE — Auth creates "Default Family" for every new user
- Each new user now creates their own unique family in a DB transaction.

### ~~P1-4~~: ✅ DONE — LIKE search is case-sensitive on PostgreSQL
- Changed to `ILIKE` in `asset.service.ts`.

---

## MEDIUM (P2) — Code quality / UX

### ~~P2-1~~: ✅ DONE — OpenAI model hardcoded
- Model now read from `OPENAI_MODEL` env var (default `gpt-4o-mini`).

### P2-2: Dashboard warranty window hardcoded
- **File**: `server/src/modules/dashboard/dashboard.service.ts`
- **Problem**: "+30 days" for warranty expiration window is hardcoded.
- **Fix**: Make it a config value or query param.

### P2-3: SpeechRecognition API lacks fallback
- **File**: `web/src/components/NaturalInputBox.tsx`
- **Problem**: Voice input silently fails if browser doesn't support `webkitSpeechRecognition` (e.g., Firefox). No user feedback.
- **Fix**: Check `'SpeechRecognition' in window || 'webkitSpeechRecognition' in window` on mount; hide or disable the mic button if unsupported.

### ~~P2-4~~: ✅ DONE — avatarUrl saved from Google OAuth profile
### ~~P2-5~~: ✅ DONE — JWT expiresIn `as any` replaced with `|| '7d'`
### ~~P2-6~~: ✅ DONE — CSV export uses static imports

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
- ✅ Fix `MaintenanceScheduler` not registered in `notification.module.ts` — added to providers + `Asset` entity to imports
- ✅ Fix `category.service.ts` `update()` and `delete()` returning `null` → now throw `NotFoundException`
- ✅ Fix `expense.service.ts` `update()` and `delete()` returning `null` → now throw `NotFoundException`
- ✅ Fix `asset.service.ts` `update()` returning `null` silently when asset not found → verify existence first, then throw `NotFoundException`; same for `delete()`
- ✅ Fix `calendar.service.ts` `{ id } as any` participants cast → typed as `User`
- ✅ Add `isError` state to `Dashboard.tsx`, `AssetList.tsx`, `CategoryList.tsx`, `ExpenseList.tsx`
- ✅ Standardize `web/src/api/calendar.ts` — remove internal `.data` unwrapping to match all other API modules; update `CalendarPage.tsx` usages
- ✅ Fix `ParsedPreviewModal.tsx` — respect `entryType` and `isTransfer` from AI response instead of always deriving from intent
- ✅ Updated REQUIREMENTS.md: `ExpenseEntryType`, `isTransfer`, `CategoryType/Level`, `validateAssetCategory`, DB-backed notifications, avatarUrl auto-provisioning
- ✅ Updated `AI_HANDOVER.md`: notification implementation, OpenAI model config, known issues trimmed to actual remaining debt
