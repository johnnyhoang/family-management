# Database Setup Guide

This guide will help you set up the MySQL database for the Family Asset & Expense Management System.

## 1. Create the Database
The application expects a database named `family_mgmt`. You can create it using a MySQL client (like MySQL Workbench, TablePlus, or the command line):

```sql
CREATE DATABASE family_mgmt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Configure Credentials
Update your `server/.env` file with your local MySQL credentials.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username (usually 'root')
DB_PASSWORD=your_password
DB_DATABASE=family_mgmt
DB_SYNCHRONIZE=true
```
> [!IMPORTANT]
> Setting `DB_SYNCHRONIZE=true` allows TypeORM to automatically create all tables based on the entities when the server starts. This should be used for initial setup only.

## 3. Verify Redis
The application also requires **Redis** to be running for background tasks (BullMQ).
- **Windows**: Use [Redis for Windows](https://github.com/microsoftarchive/redis/releases) or Docker.
- **Docker**: `docker run -d -p 6379:6379 redis`

## 4. Run the Application
Once the database is created and `.env` is updated, run:
```bash
npm run dev
```
The server will connect to MySQL and automatically generate the necessary tables. Check the console for "Application is running" or any connection errors.
