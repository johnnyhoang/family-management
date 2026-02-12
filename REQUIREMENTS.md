# Project Requirements & Specifications

## 1. General Architecture
- **Type**: Client-Server Monorepo
- **Backend**: NestJS + TypeORM + MySQL (Google Cloud SQL)
- **Frontend**: React (Vite) + TypeScript
- **API Versioning**: `/api/v1`
- **Documentation**: Swagger UI at `/api/docs`
- **Multi-tenancy**: Strict data isolation per family via `familyId` on all tables.
- **Data Integrity**: Soft delete for all main entities.
- **Language**: Vietnamese (default), with i18n structure for future English support.

## 2. Authentication & Roles
- **Login**: Google OAuth only.
- **Session**: JWT access tokens.
- **Roles**:
  - `System Admin`: Global management of all families.
  - `Family Admin`: Full control within a single family.
  - `Member`: Standard family user.
  - `Relative`: External user with specific permissions.
- **Family Structure**: Each user belongs to exactly one family (except System Admin).
- **Invitations**: Family Admins can invite users via links.

## 3. Permission System (RBAC)
Configurable per **Module** and **Asset Category**.
- **Modules**: Asset, Expense, Category, User, Dashboard, Notification.
- **Actions**: View, Add, Edit, Delete, Receive Notification.
- **Relative Permissions**: Same model as Members, but manually granted by Family Admin.

## 4. Asset Management
- **Hierarchy**: Support for Parent-Child relationships (House → Room → Item).
- **Entity Fields**:
  - `id`, `familyId`, `categoryId`, `parentAssetId`
  - `name`, `description`, `purchaseDate`, `purchasePrice`, `currentValue`
  - `warrantyExpiredAt`, `serialNumber`
  - `status` (ACTIVE | BROKEN | SOLD | LOST | ARCHIVED)
  - `location`, `assignedToUserId`, `notes`, `images` (URLs), `documents`
  - `customFields` (JSON)
- **Files**: Max 10 images per asset.

## 5. Expense Management
- **Types**: PURCHASE, MAINTENANCE, REPAIR, UTILITIES (Elec/Water/Net/Gas), RENT, TAX, INSURANCE, SUBSCRIPTION, DEPRECIATION, OTHER.
- **Entity Fields**:
  - `id`, `familyId`, `assetId` (nullable), `type`, `amount`, `currency`
  - `expenseDate`, `isRecurring`, `recurringCycle` (MONTHLY | YEARLY)
  - `reminderEnabled`, `note`, `customFields` (JSON)

## 6. Reminders & Notifications
- **Events**: Recurring expenses, Maintenance, Warranty expiration, Due dates.
- **Channels**: Push notifications only.
- **Logic**: Configurable "notify before X days".
- **Stack**: BullMQ for scheduling + NestJS Schedule (Cron).

## 7. Category Management
- **Default categories**: Provided by the system (Common practical categories).
- **Hierarchy**: Categories support parent/child structure.
- **Access**: Permissions can be assigned per category.

## 8. Dashboard & Export
- **Dashboard**: Total assets, Monthly expenses, Expense by category chart, Expiring warranties, Upcoming reminders.
- **Charts**: Recharts/Chart.js integration.
- **Export**: CSV export for Assets and Expenses.

## 9. Admin Panels
- **System Admin**: Manage families (Enable/Disable), global categories, system stats, user management.
- **Family Admin**: Member/Relative management, RBAC configuration, asset/expense management.

## 10. File Storage
- **Provider**: Google Cloud Storage (GCS).
- **Format**: Store only URLs in the database.

## 11. Deployment
- **Backend**: Google Cloud Run.
- **Database**: Google Cloud SQL (MySQL).
- **Storage**: Google Cloud Storage.
- **Frontend**: Firebase Hosting or Cloud Run.
