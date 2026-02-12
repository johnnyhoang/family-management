# Family Asset & Expense Management System

A production-ready solution for managing family wealth and spending.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- MySQL Server
- Redis (for BullMQ)

### 2. Setup
```bash
# Install dependencies for the entire monorepo
npm install
npm run install:all

# Configure environment
cp server/.env.example server/.env
# Update server/.env with your local DB and Redis credentials
```

### 3. Development
```bash
# Start both Backend and Frontend
npm run dev
```
- **Backend API**: http://localhost:3173/api/v1
- **Swagger Docs**: http://localhost:3173/api/docs
- **Frontend App**: http://localhost:5173

## 📖 Documentation
- **[Requirements & Specs](./REQUIREMENTS.md)**: Original detailed project specifications.
- **[AI Handover & Technical Guide](./AI_HANDOVER.md)**: Technical architecture and extension guide.
- **[Deployment & CI/CD Guide](./DEPLOYMENT.md)**: Google Cloud setup and automation.
- **[Implementation Walkthrough](file:///C:/Users/hoa.hoang/.gemini/antigravity/brain/1038cf4c-e9c7-404d-aee0-38a9cc521d01/walkthrough.md)**: Details on what was built and verified.

## 🛠 Features
- **Multi-tenancy**: Strict data isolation per family.
- **RBAC**: Module and Category level permissions.
- **Asset Management**: Hierarchical tracking and maintenance alerts.
- **Expense Tracking**: Financial analytics and recurring cost management.
- **Smart Notifications**: Automated warranty and maintenance reminders.
- **Internationalization**: Full Vietnamese support (i18n ready).

## 🐋 Deployment
Dockerfiles are provided for both `server` and `web` services. The system is designed for **Google Cloud Run** and **Google Cloud SQL**.

---
*Built with NestJS, React, and TypeORM.*
