# Google Cloud Deployment & CI/CD Guide

This guide provides step-by-step instructions for deploying the Family Asset & Expense Management System to Google Cloud and setting up automated CI/CD.

## 1. Infrastructure Requirements
The system requires the following Google Cloud services:
- **Cloud Run**: For hosting the `server` (API) and `web` (Frontend) containers.
- **Cloud SQL (MySQL)**: For the database.
- **Cloud Storage**: For asset images and documents.
- **Cloud Build**: For the CI/CD pipeline.
- **Artifact Registry**: To store Docker images.
- **Secret Manager**: To securely store sensitive environment variables.

---

## 2. Infrastructure Setup (Manual Steps)

### A. Cloud SQL (MySQL)
1. Create a **Cloud SQL for MySQL** instance (v8.0).
2. Create a database named `family_mgmt`.
3. Create a user and password.
4. **Cloud Run Connection**: 
   - Use the "Authorized Networks" for Public IP or the Cloud SQL Auth Proxy (built into Cloud Run).
   - In Cloud Run configuration, under **Connections**, add your Cloud SQL instance.
   - The instance connection name will look like `project:region:instance`.

### B. Environment Variables for Database
| Variable | Value for Cloud Run |
| :--- | :--- |
| `DB_HOST` | `127.0.0.1` (when using Cloud SQL Proxy) or Private IP |
| `DB_PORT` | `3306` |
| `DB_SYNCHRONIZE` | `true` (Set to `true` for first deployment to auto-create tables) |
| `DB_SSL` | `false` (usually false when using the Proxy, true for Public IP) |

### B. Cloud Storage
1. Create a bucket (e.g., `family-mgmt-assets`).
2. Ensure the "Uniform bucket-level access" is enabled.
3. Grant `roles/storage.objectViewer` to `allUsers` if public access is needed, or manage via signed URLs.

### C. Artifact Registry
1. Create a repository named `family-app` in your preferred region (e.g., `asia-southeast1`).

---

## 3. Secret Manager & Environment Variables
Store these sensitive keys in **Secret Manager** and map them in Cloud Run:

| API Variable | Source / Value |
| :--- | :--- |
| `DB_HOST` | Cloud SQL instance connection name or IP |
| `DB_PASSWORD` | Secret Manager |
| `JWT_SECRET` | Secret Manager |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console Credentials |
| `GOOGLE_CLIENT_SECRET` | Secret Manager |
| `GOOGLE_CALLBACK_URL` | `https://[YOUR-API-DOMAIN]/api/v1/auth/google/callback` |
| `FRONTEND_URL` | `https://[YOUR-WEB-DOMAIN]` |

---

## 4. CI/CD Setup with Cloud Build

### A. Connect Repository
1. Go to **Cloud Build > Triggers** in the Google Cloud Console.
2. Click **Manage Repositories** and connect your GitHub repository.

### B. Create Trigger
1. Name: `deploy-on-master-push`
2. Event: **Push to a branch**
3. Branch: `^master$`
4. Configuration: **Cloud Build configuration file (yaml/json)**
5. Location: `Repository` / `cloudbuild.yaml`

### C. Variables
In the trigger configuration, add these **Substitution variables**:
- `_REGION`: `asia-southeast1` (or your region)
- `_INSTANCE_CONNECTION_NAME`: Your Cloud SQL connection name (e.g., `project:region:instance`)

---

## 5. Deployment Flow
The `cloudbuild.yaml` in the root directory handles:
1. **Parallel Build**: Builds both `server` and `web` Docker images.
2. **Push**: Uploads images to Google Artifact Registry.
3. **Deploy API**: Deploys the `server` to Cloud Run.
4. **Deploy Web**: Deploys the `web` frontend to Cloud Run.

## 6. Database Migrations & Synchronization
- **Initial Deployment**: Set `DB_SYNCHRONIZE=true` to allow TypeORM to create the tables automatically on the first run.
- **Production Best Practice**: After the initial schema is created, set `DB_SYNCHRONIZE=false` and use **TypeORM Migrations** for any future schema changes to prevent accidental data loss.

## 7. Verifying Connection
1. **Logs**: Check Cloud Run logs for `QueryFailedError` or `ConnectionRefused`.
2. **Cloud SQL Proxy**: Ensure the service account used by Cloud Run has the `roles/cloudsql.client` permission.
3. **Database Ping**: If the server starts and shows Swagger/API logs, the connection is likely successful.

## 8. Post-Deployment Check
