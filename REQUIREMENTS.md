# Project Requirements & Specifications

## 1. General Architecture
- **Type**: Client-Server Monorepo (npm workspaces)
- **Backend**: NestJS + TypeORM + PostgreSQL (Supabase)
- **Frontend**: React 19 (Vite) + TypeScript
- **Node Version**: >=22.13.0 (see `.nvmrc`)
- **API Versioning**: `/api/v1`
- **Documentation**: Swagger UI at `/api/docs`
- **Multi-tenancy**: Strict data isolation per family via `familyId` on all tables.
- **Data Integrity**: Soft delete (`deletedAt`) for all main entities.
- **Language**: Vietnamese (default), i18n-ready for English.

## 2. Authentication & Roles
- **Login**: Google OAuth2 only.
- **Session**: JWT access tokens (stored in localStorage).
- **Roles** (`UserRole` enum):
  - `SYSTEM_ADMIN`: Global management of all families.
  - `FAMILY_ADMIN`: Full control within a single family.
  - `MEMBER`: Standard family user.
  - `RELATIVE`: External user with manually-granted permissions.
  - `VIEWER`: Read-only access.
- **Family Structure**: Each user belongs to exactly one family (except System Admin).
- **Invitations**: Family Admins can invite users via links.
- **Auto-provisioning**: First OAuth login creates user + "Default Family" automatically.

## 3. Permission System (RBAC)
Configurable per **Module** and optionally per **Asset Category**.
- **Modules**: Asset, Expense, Category, User, Dashboard, Notification.
- **Actions**: `canView`, `canAdd`, `canEdit`, `canDelete`, `canNotify`.
- **Guard**: `PermissionGuard` + `@CheckPermission(moduleId, action)` decorator.
- **SYSTEM_ADMIN** and **FAMILY_ADMIN** bypass permission checks.
- **Relative Permissions**: Same model as Members, but manually granted by Family Admin.

## 4. Asset Management
- **Hierarchy**: Parent-Child relationships (e.g., House → Room → Item).
- **Entity Fields**:
  - `id`, `familyId`, `categoryId`, `parentAssetId`
  - `name`, `description`, `purchaseDate`, `purchasePrice`, `currentValue`
  - `warrantyExpiredAt`, `serialNumber`, `maintenanceIntervalDays`, `nextMaintenanceDate`
  - `status`: `ACTIVE | BROKEN | SOLD | LOST | ARCHIVED`
  - `location`, `assignedToUserId`, `ownerId`, `usedById`
  - `notes`, `images` (URL array), `documents` (URL array)
  - `customFields` (JSON – for domain-specific extensibility)
- **Files**: Max 10 images per asset, stored in GCS, URLs saved in DB.
- **Export**: CSV download via frontend.

## 5. Expense Management
- **Types**: `PURCHASE | MAINTENANCE | REPAIR | UTILITIES | RENT | TAX | INSURANCE | SUBSCRIPTION | DEPRECIATION | OTHER`
- **Entity Fields**:
  - `id`, `familyId`, `assetId` (nullable), `categoryId`, `type`
  - `amount`, `currency` (default: VND)
  - `expenseDate`, `isRecurring`, `recurringCycle`: `DAILY | WEEKLY | MONTHLY | YEARLY`
  - `nextOccurrenceDate`, `reminderEnabled`, `reminderDaysBefore`
  - `note`, `customFields` (JSON)
- **Export**: CSV download via frontend.

## 6. Reminders & Notifications
- **Trigger Events**: Recurring expenses, Maintenance due dates, Warranty expiration.
- **Channels**: In-app notifications (push not yet implemented).
- **Scheduling**: NestJS Schedule (Cron jobs) for periodic checks.
- **In-process delays**: `setTimeout` in process memory — lost on restart; no Redis/queue.
- **Logic**: Configurable "notify X days before" per reminder.

## 7. Category Management
- **System defaults**: Seeded by the system (practical Vietnamese household categories).
- **Hierarchy**: Categories support parent/child structure.
- **Access Control**: Permissions can be assigned per category (granular RBAC).

## 8. Dashboard & Analytics
- **Metrics**: Total assets count/value, Monthly expense total, Expense by category, Expiring warranties, Upcoming maintenance reminders.
- **Charts**: Recharts (bar/pie).
- **Export**: CSV for Assets and Expenses.

## 9. AI Natural Language Input
- **Component**: `NaturalInputBox` (text + voice via SpeechRecognition API).
- **Parser**: OpenAI `gpt-4o` (with 1-retry on failure).
- **Vietnamese currency parsing**: "triệu", "tr", "k", "rưỡi" handled by `MoneyParserService`.
- **Supported intents**: `create_expense`, `create_income`, `create_asset`, `update_asset`, `create_event`, `create_task`, `create_note`, `unknown`.
- **Context injection**: Family members, categories, assets injected into prompt.
- **Preview & edit**: `ParsedPreviewModal` before data is saved.
- **History**: All parse results logged to `natural_input_history` table.

## 10. File Storage
- **Provider**: Google Cloud Storage (GCS).
- **Pattern**: Store URLs in DB; files uploaded directly to GCS via `FileModule`.

## 11. Admin Panels
- **System Admin**: Manage families (enable/disable), global categories, system stats.
- **Family Admin**: Member/relative management, RBAC config, full asset/expense management.

## 12. Internationalization
- **Backend**: `nestjs-i18n` with `vi/` and `en/` JSON files.
- **Frontend**: `react-i18next` with `vi/` and `en/` locale JSON files.
- **Default language**: Vietnamese (`vi`).

## 13. Deployment
- **Platform**: Vercel (both frontend and backend).
- **Backend**: NestJS as Vercel Serverless Function (entry: `server/api/index.ts`), max 30s duration.
- **Frontend**: Vercel Static Site (React/Vite build).
- **Database**: Supabase (PostgreSQL).
- **Storage**: Google Cloud Storage.
- **Environment**: See `server/.env.example` and `web/.env.example`.

## 14. Development
- **Start all**: `npm run dev` (root – runs server + web in parallel via `concurrently`).
- **Backend only**: `npm run start:server` → http://localhost:3173
- **Frontend only**: `npm run start:web` → http://localhost:5173
- **DB Migrations**: TypeORM migrations in `server/src/migrations/`.
