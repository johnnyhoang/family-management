# AI Handover Documentation: Family Asset & Expense Management System

## 1. System Overview
A production-ready, multi-tenant system for managing family assets and expenses.
- **Goal**: Strict data isolation per family, hierarchical asset management, and automated financial tracking.
- **Full Specs**: Refer to **[REQUIREMENTS.md](./REQUIREMENTS.md)** for detailed functional requirements.
- **Language**: Core UI in Vietnamese (i18n ready).
- **Architecture**: Monorepo with NestJS (Backend) and React/Vite (Frontend).

## 2. Tech Stack
| Component | Technology |
| :--- | :--- |
| **Backend** | NestJS, TypeORM, MySQL (Google Cloud SQL) |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Ant Design |
| **Auth** | Google OAuth2, JWT |
| **Process Queue** | BullMQ (via Redis) |
| **Scheduling** | NestJS Schedule (Cron) |
| **Storage** | Google Cloud Storage |
| **I18n** | nestjs-i18n (Backend), react-i18next (Frontend) |
| **Deployment** | Google Cloud Run, Docker |

## 3. Project Structure
```text
family-management/
├── server/                 # NestJS Backend
│   ├── src/
│   │   ├── common/         # Shared entities, guards, decorators
│   │   ├── modules/        # Feature modules (Auth, Asset, Expense, etc.)
│   │   └── main.ts         # App entry, Swagger, Versioning
│   ├── i18n/               # Translation files (vi/en)
│   └── Dockerfile          # Backend containerization
├── web/                    # React Frontend
│   ├── src/
│   │   ├── api/            # Axios client & interceptors
│   │   ├── components/     # Layout & UI components
│   │   ├── pages/          # Feature pages
│   │   ├── locales/        # Frontend translations
│   │   └── App.tsx         # Router & Providers
│   ├── tailwind.config.js  # Design tokens
│   ├── nginx.conf          # SPA routing for Docker
│   └── Dockerfile          # Frontend containerization
└── package.json            # Monorepo scripts (concurrently)
```

## 4. Business Logic & Constraints
- **Multi-tenancy**: Every entity (except User in some contexts) must have a `familyId`.
- **RBAC**: Module-level and Category-level permissions are checked via `PermissionGuard` and `@CheckPermission` decorator.
- **Soft Delete**: All main entities use `deletedAt` for soft deletes.
- **Asset Hierarchy**: Supports parent-child relationships (e.g., House -> Room -> Item).
- **Versioning**: API is versioned under `/api/v1`.

## 5. Implementation Details
### Backend
- **Auth**: `GoogleStrategy` for login, `JwtStrategy` for API protection.
- **Permissions**: `PermissionGuard` queries the `Permission` entity based on the user's role and the required `moduleId`.
- **Notifications**: `MaintenanceScheduler` runs daily at midnight to check for expiring warranties and pushes jobs to BullMQ.

### Frontend
- **Design**: "Glassmorphism" aesthetic using Tailwind's backdrop-blur and Ant Design tokens.
- **State**: `TanStack Query` (React Query) handles all server-side data fetching.
- **Responsiveness**: Mobile-first design using Tailwind grid and flex layouts.

## 6. How to Continue & Expand
### Adding a New Module
1. **Entity**: Create a new entity in `server/src/common/entities/` (inherit from `BaseEntity`).
2. **Module**: Generate NestJS module, service, and controller in `server/src/modules/`.
3. **Permissions**: Add entries to the `Permission` entity seeds and use `@CheckPermission` in the controller.
4. **Frontend API**: Add endpoints to `web/src/api/`.
5. **Frontend Pages**: Create new pages in `web/src/pages/` and register in `web/src/App.tsx`.

### Extending Custom Fields
- Both `Asset` and `Expense` entities have a `customFields: JSON` column.
- Use this for domain-specific data without modifying the schema.

## 7. Configuration
- Use `server/.env.example` for backend configuration.
- Use `VITE_API_URL` environment variable for frontend API mapping.

## 8. Cloud Deployment (Google Cloud Run)
When deploying to Cloud Run, the system automatically adapts via environment variables:
- **Port**: Cloud Run injects the `PORT` variable. The backend is configured to prioritize `process.env.PORT` over the local `3173`.
- **Database Synchronization**: Set `DB_SYNCHRONIZE=true` for the first deployment to auto-create the schema in Cloud SQL.
- **OAuth Callbacks**: Ensure `GOOGLE_CALLBACK_URL` is set to the production domain (e.g., `https://api-service-xyz.a.run.app/api/v1/auth/google/callback`).
- **CORS**: The backend should be configured to allow the frontend Cloud Run URL.
- **Frontend**: The `web/src/api/client.ts` will use the `VITE_API_URL` injected at build time or via container environment.

## 9. Development Commands
- `npm run dev`: Start both server and web in parallel.
- `npm run start:server`: Start NestJS in dev mode.
- `npm run start:web`: Start Vite dev server.

---
**Handover Note**: The system is fully scaffolded with core logic (Auth, RBAC, Multi-tenancy). 
- Refer to **[REQUIREMENTS.md](./REQUIREMENTS.md)** for the original source of truth.
- Refer to **[DEPLOYMENT.md](./DEPLOYMENT.md)** for Google Cloud & CI/CD instructions.
- Refer to **[walkthrough.md](file:///C:/Users/hoa.hoang/.gemini/antigravity/brain/1038cf4c-e9c7-404d-aee0-38a9cc521d01/walkthrough.md)** for implementation details.
