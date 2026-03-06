# Family Asset & Expense Management System

A production-ready solution for managing family wealth and spending.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- Supabase Account
- Vercel Account

### 2. Setup
```bash
# Install dependencies for the entire monorepo
npm install

# Configure environment
# 1. Server: Copy server/.env.example to server/.env
# 2. Web: Copy web/.env.example to web/.env
# Update both with your Supabase and Vercel credentials
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

## 🛠 Features
- **Multi-tenancy**: Strict data isolation per family.
- **RBAC**: Module and Category level permissions.
- **Asset Management**: Hierarchical tracking and maintenance alerts.
- **Expense Tracking**: Financial analytics and recurring cost management.
- **Smart Notifications**: Automated warranty and maintenance reminders.
- **Internationalization**: Full Vietnamese support (i18n ready).

## ☁️ Deployment
The system is optimized for **Vercel** (hosting) and **Supabase** (PostgreSQL database).
- **Backend**: Deployed as Vercel Serverless Functions (NestJS).
- **Frontend**: Deployed as a Vercel Static Site (React/Vite).

---
*Built with NestJS, React, and TypeORM.*
