# System Architecture

## 1. High-Level Overview

```
┌─────────────────────────────────────────┐
│              Vercel CDN                 │
│  ┌────────────────┐  ┌───────────────┐  │
│  │ React SPA      │  │ NestJS        │  │
│  │ (Static)       │  │ (Serverless)  │  │
│  │ web/           │  │ server/       │  │
│  └───────┬────────┘  └──────┬────────┘  │
└──────────┼──────────────────┼───────────┘
           │ VITE_API_URL     │ DATABASE_URL
           │                  ▼
           │         ┌─────────────────┐
           │         │ Supabase        │
           │         │ (PostgreSQL)    │
           │         └─────────────────┘
           │                  │ GCS_KEY_FILE
           │                  ▼
           │         ┌─────────────────┐
           │         │ Google Cloud    │
           │         │ Storage (GCS)   │
           │         └─────────────────┘
           │                  │ OPENAI_API_KEY
           │                  ▼
           │         ┌─────────────────┐
           └────────►│ OpenAI API      │
                     │ (gpt-4o)        │
                     └─────────────────┘
```

## 2. Request Lifecycle

```
Browser → GET /api/v1/assets
  → Vercel routes /api/** → NestJS serverless fn
  → JwtGuard validates Bearer token
  → PermissionGuard checks role + moduleId
  → AssetController.findAll()
  → AssetService queries PostgreSQL (TypeORM)
  → Response JSON
```

## 3. Authentication Flow

```
User clicks "Login with Google"
  → /api/v1/auth/google (GoogleStrategy)
  → Google OAuth2 callback
  → validateOAuthUser():
      ├── Find user by googleId or email
      ├── If new: create User + create Family ("Default Family")
      └── Update profile (avatar, name)
  → signJwt({ userId, familyId, role })
  → Redirect to /login-success?token=<jwt>
  → Frontend stores token in localStorage
  → All API calls: Authorization: Bearer <token>
```

## 4. Database Schema

### Entity Inheritance
All entities extend `BaseEntity`:
```
BaseEntity
  ├── id: UUID (primary key, auto-generated)
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── deletedAt: timestamp (soft delete)
```

### Entity Relationship Diagram
```
Family (1)
  ├── User (N) — familyId FK
  │     └── Asset.assignedToUserId, ownerId, usedById → User
  ├── Asset (N) — familyId FK
  │     ├── Asset.parentAssetId → Asset (self-reference hierarchy)
  │     ├── Asset.categoryId → Category
  │     └── Expense.assetId → Asset
  ├── Expense (N) — familyId FK
  │     └── Expense.categoryId → Category
  ├── Category (N) — familyId FK
  │     └── Category.parentCategoryId → Category (self-reference)
  ├── Permission (N) — familyId FK
  │     └── role + moduleId + categoryId → action flags
  ├── CalendarEvent (N) — familyId FK
  ├── Notification (N) — familyId FK
  └── NaturalInputHistory (N) — familyId FK
```

### Key Entities

#### User
| Column | Type | Notes |
| :--- | :--- | :--- |
| id | UUID | PK |
| familyId | UUID | FK → Family |
| email | varchar | unique |
| googleId | varchar | unique |
| fullName | varchar | |
| avatarUrl | varchar | |
| role | enum | SYSTEM_ADMIN, FAMILY_ADMIN, MEMBER, RELATIVE, VIEWER |
| isActive | boolean | |

#### Asset
| Column | Type | Notes |
| :--- | :--- | :--- |
| id | UUID | PK |
| familyId | UUID | FK → Family |
| categoryId | UUID | FK → Category (nullable) |
| parentAssetId | UUID | Self-reference (nullable) |
| name | varchar | |
| purchasePrice | decimal | |
| currentValue | decimal | |
| status | enum | ACTIVE, BROKEN, SOLD, LOST, ARCHIVED |
| warrantyExpiredAt | date | |
| maintenanceIntervalDays | int | |
| nextMaintenanceDate | date | |
| images | json | URL array |
| documents | json | URL array |
| customFields | json | Extensible |

#### Expense
| Column | Type | Notes |
| :--- | :--- | :--- |
| id | UUID | PK |
| familyId | UUID | FK → Family |
| assetId | UUID | FK → Asset (nullable) |
| categoryId | UUID | FK → Category (nullable) |
| amount | decimal | |
| currency | varchar | Default: VND |
| expenseDate | date | |
| isRecurring | boolean | |
| recurringCycle | enum | DAILY, WEEKLY, MONTHLY, YEARLY |
| nextOccurrenceDate | date | |
| reminderEnabled | boolean | |
| customFields | json | Extensible |

#### Permission
| Column | Type | Notes |
| :--- | :--- | :--- |
| id | UUID | PK |
| familyId | UUID | FK → Family |
| role | enum | UserRole |
| moduleId | varchar | asset, expense, category, user, dashboard, notification |
| categoryId | UUID | Optional — category-level grant |
| canView | boolean | |
| canAdd | boolean | |
| canEdit | boolean | |
| canDelete | boolean | |
| canNotify | boolean | |

## 5. RBAC Architecture

```
HTTP Request
  │
  ▼
JwtGuard ──── invalid ──► 401 Unauthorized
  │
  ▼ valid (req.user = { userId, familyId, role })
  │
PermissionGuard
  ├── role === SYSTEM_ADMIN? ──► allow
  ├── role === FAMILY_ADMIN? ──► allow
  └── query Permission table (familyId + role + moduleId)
        ├── found + action flag true? ──► allow
        └── not found / false ──► 403 Forbidden
```

## 6. Frontend Architecture

```
App.tsx
  ├── Providers: QueryClientProvider, I18nextProvider, ConfigProvider (Ant Design)
  └── Router
        ├── /login → Login page (public)
        ├── /login-success → stores token, redirect (public)
        └── AuthGuard (private)
              ├── /dashboard → Dashboard
              ├── /assets → AssetList
              ├── /expenses → ExpenseList
              ├── /categories → CategoryList
              ├── /members → MemberList
              ├── /calendar → CalendarPage
              └── /settings → Settings

State Management:
  - Server state: TanStack Query (React Query v5) — all API calls
  - No global client state store (Context API only where needed)

API Layer (web/src/api/):
  - client.ts: Axios instance, token injection via interceptor
  - assets.ts, expenses.ts, categories.ts, etc. — feature-specific
```

## 7. AI Natural Input Flow

```
User types/speaks text
  │
NaturalInputBox (frontend)
  ├── Voice: SpeechRecognition API → text
  └── Text: direct input
  │
POST /api/v1/natural-input/parse
  │
NaturalInputService.parse()
  ├── Fetch context (categories, family members, assets) — in-memory cached 5 min
  ├── MoneyParserService: pre-process Vietnamese currency
  ├── Build system prompt with context
  ├── OpenAI gpt-4o call (json_object format)
  ├── On fail: 1 retry
  ├── JSON.parse response
  └── Save to natural_input_history table
  │
ParsedPreviewModal (frontend)
  ├── Show detected intent + fields
  ├── User edits if needed
  └── Submit → POST /api/v1/expenses (or /assets, etc.)
```

## 8. Notification & Scheduling

```
@Cron('0 8 * * *')  — runs daily at 8:00 AM
  │
MaintenanceScheduler / ExpenseScheduler
  ├── Query assets where warrantyExpiredAt BETWEEN now AND now+30d
  ├── Query assets where nextMaintenanceDate <= now
  ├── Query expenses where nextOccurrenceDate <= now + reminderDaysBefore
  └── For each hit:
        └── NotificationService.create() → save to notifications table

In-process delays (setTimeout):
  ├── Used for one-off delay notifications
  ├── NOT persisted — lost on restart
  └── Should be replaced with BullMQ or similar queue
```

## 9. File Upload Flow

```
Frontend: <input type="file"> → POST /api/v1/files/upload
  │
FileService
  ├── Receive multipart/form-data (Multer)
  ├── Upload buffer to GCS bucket
  ├── Return { url: "https://storage.googleapis.com/..." }
  │
Asset/Expense update:
  └── Save returned URL into images[] or documents[] JSON column
```

## 10. Known Constraints & Tradeoffs

| Constraint | Impact | Mitigation Path |
| :--- | :--- | :--- |
| Vercel serverless (30s timeout) | No long-running tasks | Use queues / cron triggers |
| `setTimeout` notifications | Lost on restart | Replace with BullMQ + Redis |
| No DB indexes on `familyId` | Slow queries at scale | Add composite indexes |
| No test coverage | Risky refactors | Add Jest integration tests |
| OpenAI dependency | Parse fails without API | Graceful error + manual fallback |
| `customFields: JSON` untyped | Runtime errors | Add JSON Schema validation |
