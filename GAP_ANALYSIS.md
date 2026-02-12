# Gap Analysis: Implementation vs Requirements

This document outlines what has been built and what is still needed or currently at an MVP/placeholder level.

## 1. Core Backend Modules

### [DONE / MVP]
- **AuthModule**: Google OAuth and JWT are working. User/Family auto-creation logic exists but needs better separation into `UserModule` and `FamilyModule`.
- **AssetModule**: CRUD functionality is operational. Multi-tenancy is enforced.
- **ExpenseModule**: CRUD functionality is operational.
- **CategoryModule**: Basic CRUD and hierarchy (parent/children) supported.
- **NotificationModule**: BullMQ processor and Maintenance Scheduler (Cron) implemented.
- **DashboardModule**: Statistical aggregation for assets and expenses implemented.

### [MISSING / PLACEHOLDER]
- **UserModule**: Missing API for managing family members and invitations.
- **FamilyModule**: Logic for family settings and status management is currently mixed into `AuthService`.
- **PermissionModule**: The directory is empty. RBAC currently relies on manually seeded data or default logic in the guard.
- **FileModule**: No integration with Google Cloud Storage yet. No API for file uploads/downloads.
- **AdminModule**: Missing the system-level and family-level administrative controllers/services.

---

## 2. Feature Gaps vs specs

### Asset Management
- **Hierarchy Details**: Service lacks logic for deep-nested asset structures (e.g., retrieving an asset AND its entire sub-tree).
- **Custom Fields**: Entity supports them, but no validation or specialized logic in the service.
- **Documents/Images**: No actual file handling (Relies on `FileModule`).

### Expense Management
- **Recurring Logic**: Currently only stores the "cycle" as data. Missing a background task to actually "generate" periodic expenses or calculate future projections.
- **Asset Association**: Supported in entity, but UI doesn't allow linking yet.

### Permissions
- **Relative Permissions**: The spec calls for specific logic for "Relative" roles. This is not yet implemented in the `PermissionGuard`.

---

## 3. Frontend Gaps

### [DONE]
- Main Layout, Sidebar, and basic Dashboard with Recharts.
- I18n structure (Vietnamese/English).

### [MISSING]
- **Asset Management**: `AssetList` is a placeholder. No detail view or creation forms.
- **Expense Management**: `ExpenseList` is a placeholder. No analytics views.
- **User Management**: No UI for inviting members or managing roles.
- **Category Management**: No UI for creating/editing categories.
- **Admin Panel**: No UI for System or Family Admin tasks.

---

## 4. Proposed Next Steps (Priority Order)

1. **Complete User & Family Modules**: Encapsulate user management and invitation logic.
2. **Implement PermissionModule**: Build the API to manage the `Permission` entity so RBAC can be configured via UI.
3. **Build Asset & Expense UIs**: Move beyond placeholders to interactive lists and forms.
4. **Implement FileModule**: Connect to Google Cloud Storage for real image/document uploads.
5. **Implement CSV Export**: Add data portability as required by specs.
6. **Refine Dashboard**: Add historical expense trends and deeper asset analytics.
