# AI Handover Documentation: Family Asset & Expense Management System

## 1. System Overview
A production-ready, multi-tenant system for managing family assets and expenses.
- **Goal**: Strict data isolation per family, hierarchical asset management, automated financial tracking, AI-powered natural language input.
- **Full Specs**: See **[REQUIREMENTS.md](./REQUIREMENTS.md)** for detailed functional requirements.
- **Architecture Specs**: See **[docs/specs/ARCHITECTURE.md](./docs/specs/ARCHITECTURE.md)**.
- **Language**: Core UI in Vietnamese (`vi`), i18n-ready.
- **Monorepo**: NestJS backend (`server/`) + React/Vite frontend (`web/`).

## 2. Tech Stack
| Component | Technology | Version |
| :--- | :--- | :--- |
| **Backend** | NestJS | 11.x |
| **ORM** | TypeORM | 0.3.x |
| **Database** | PostgreSQL (Supabase) | — |
| **Frontend** | React + TypeScript + Vite | 19 / 7.x |
| **Styling** | Tailwind CSS + Ant Design | 3.4 / 6.x |
| **State** | TanStack Query (React Query) | 5.x |
| **Routing** | React Router | 7.x |
| **Auth** | Google OAuth2 + JWT | — |
| **AI** | OpenAI SDK (`gpt-4o`) | 4.x |
| **Scheduling** | NestJS Schedule (Cron) | — |
| **Storage** | Google Cloud Storage | 7.x |
| **Charts** | Recharts | 3.x |
| **I18n** | nestjs-i18n / react-i18next | — |
| **Deployment** | Vercel (Serverless + Static) | — |
| **Node** | >=22.13.0 | — |

## 3. Project Structure
```text
family-management/
├── server/                       # NestJS Backend
│   ├── src/
│   │   ├── common/
│   │   │   ├── entities/         # 9 DB entities (all extend BaseEntity)
│   │   │   ├── guards/           # PermissionGuard (RBAC)
│   │   │   └── decorators/       # @CheckPermission decorator
│   │   ├── modules/              # 13 feature modules
│   │   │   ├── auth/             # Google OAuth2 + JWT
│   │   │   ├── user/             # User/member management
│   │   │   ├── family/           # Multi-tenancy root entity
│   │   │   ├── asset/            # Hierarchical asset tracking
│   │   │   ├── expense/          # Recurring expense management
│   │   │   ├── category/         # Asset/expense categories
│   │   │   ├── dashboard/        # Analytics & aggregations
│   │   │   ├── calendar/         # Event scheduling
│   │   │   ├── notification/     # In-app alerts
│   │   │   ├── permission/       # RBAC configuration
│   │   │   ├── file/             # GCS file uploads
│   │   │   ├── natural-input/    # AI text parsing (OpenAI)
│   │   │   └── admin/            # System admin operations
│   │   ├── migrations/           # TypeORM migrations
│   │   ├── data-source.ts        # TypeORM PostgreSQL config
│   │   └── main.ts               # Entry: Swagger, CORS, versioning
│   ├── i18n/                     # vi/ and en/ translation JSON
│   ├── api/index.ts              # Vercel serverless entry point
│   └── .env.example
├── web/                          # React Frontend
│   ├── src/
│   │   ├── api/                  # Axios modules per feature
│   │   ├── components/
│   │   │   ├── layout/           # MainLayout (sidebar + header)
│   │   │   ├── auth/             # AuthGuard
│   │   │   ├── NaturalInputBox   # AI text + voice input
│   │   │   ├── ParsedPreviewModal # Review/edit before save
│   │   │   └── QRScannerModal    # QR asset lookup
│   │   ├── pages/                # 9 feature pages
│   │   ├── locales/              # vi/ and en/ i18n JSON
│   │   └── App.tsx               # Router + providers + theme
│   ├── tailwind.config.js
│   └── .env.example
├── docs/specs/                   # Feature specs
├── REQUIREMENTS.md               # Functional requirements (source of truth)
├── AI_HANDOVER.md                # This file
├── vercel.json                   # Root Vercel deploy config
└── package.json                  # Monorepo: workspaces + concurrently scripts
```

## 4. Business Logic & Constraints
- **Multi-tenancy**: Every entity must carry `familyId`; guard enforces it.
- **RBAC**: `PermissionGuard` + `@CheckPermission(moduleId, action)` on all controller routes. `SYSTEM_ADMIN` and `FAMILY_ADMIN` bypass checks.
- **Soft Delete**: All entities use TypeORM `@DeleteDateColumn()` (`deletedAt`). Queries auto-filter deleted rows.
- **Asset Hierarchy**: `parentAssetId` self-reference (House → Room → Item).
- **API Versioning**: All routes under `/api/v1`.
- **Auth Flow**: Google OAuth → `validateOAuthUser()` (upsert user + auto-create family for new users) → sign JWT → redirect to frontend with token.

## 5. Key Implementation Details

### Backend
| Concern | Implementation |
| :--- | :--- |
| Auth | `GoogleStrategy` (Passport) + `JwtStrategy` for API protection |
| Permission Check | `PermissionGuard` queries `Permission` entity by role + moduleId |
| Notifications | Stored in PostgreSQL with `scheduledAt` column; Cron-based surfacing — no in-process state, survives restarts |
| AI Parsing | `NaturalInputService` → OpenAI `gpt-4o-mini` (configurable via `OPENAI_MODEL`) → JSON parse → save to `natural_input_history` |
| Money Parsing | `MoneyParserService` handles Vietnamese: "triệu", "tr", "k", "rưỡi" |
| File Storage | `FileModule` uploads to GCS; only URL stored in DB |
| Scheduling | `@Cron()` decorators for warranty/maintenance/expense reminder checks |

### Frontend
| Concern | Implementation |
| :--- | :--- |
| Design System | "Glassmorphism" with Tailwind `backdrop-blur` + Ant Design tokens |
| Server State | `TanStack Query` (React Query) – all API calls via hooks |
| Responsiveness | Mobile-first Tailwind grid/flex |
| Token Storage | `localStorage` (`access_token` key) |
| API Base URL | `VITE_API_URL` env var → `web/src/api/client.ts` |

## 6. Adding a New Module (Step-by-Step)
1. **Entity**: Create in `server/src/common/entities/` — extend `BaseEntity`, add `familyId`.
2. **Module**: `nest g module/service/controller modules/<name>`.
3. **DTOs**: Create `create-<name>.dto.ts` / `update-<name>.dto.ts` with `class-validator`.
4. **Permissions**: Add `@CheckPermission(ModuleId.X, 'canAdd')` to controller methods.
5. **Register**: Import the new module in `app.module.ts` and add entity to TypeORM list.
6. **Migration**: Generate TypeORM migration after entity changes.
7. **Frontend API**: Add `web/src/api/<name>.ts` with Axios calls.
8. **Frontend Page**: Create `web/src/pages/<Name>.tsx`, register route in `App.tsx`.

## 7. Environment Variables
### Backend (`server/.env`)
| Variable | Purpose |
| :--- | :--- |
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth2 client secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback (e.g. `http://localhost:3173/api/v1/auth/google/callback`) |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `OPENAI_API_KEY` | OpenAI API key for natural input parsing |
| `GCS_BUCKET_NAME` | Google Cloud Storage bucket |
| `GCS_KEY_FILE` | Path to GCS service account JSON |
| `PORT` | Server port (default 3173; Vercel injects this) |
| `DB_SYNCHRONIZE` | `true` only for first deploy; use migrations after |

### Frontend (`web/.env`)
| Variable | Purpose |
| :--- | :--- |
| `VITE_API_URL` | Backend API base URL |

## 8. Deployment (Vercel)
- Root `vercel.json` rewrites `/api/**` → NestJS serverless function, everything else → React SPA.
- Backend entry: `server/api/index.ts` (wraps NestJS app for Vercel).
- Frontend: static build via `vite build`.
- Serverless function max duration: 30 seconds.
- **Production checklist**:
  - Set `GOOGLE_CALLBACK_URL` to production domain.
  - Configure CORS in `main.ts` for production frontend URL.
  - Set `DB_SYNCHRONIZE=false` and run migrations manually.
  - Ensure all env vars are set in Vercel project settings.

## 9. Known Issues & Technical Debt
See **[docs/specs/TODO.md](./docs/specs/TODO.md)** for the full prioritized backlog.

Top remaining items:
- **No test coverage** — only 1 placeholder spec; no integration tests for RBAC, auth, multi-tenancy, or AI parsing.
- **DB migrations pending** — `@Index` decorators and new columns added but migration must be generated and applied on next deploy (`typeorm migration:generate`).
- **SpeechRecognition no fallback** — mic input silently fails on Firefox/unsupported browsers.

## 10. Development Commands
```bash
npm run dev          # Start server + web in parallel
npm run start:server # NestJS dev server only (port 3173)
npm run start:web    # Vite dev server only (port 5173)
```
- **API Docs**: http://localhost:3173/api/docs (Swagger)
- **Frontend**: http://localhost:5173
