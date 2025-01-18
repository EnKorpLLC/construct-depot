# Development Environment Startup Process

## Pre-flight Checklist
Before starting any services, verify:
1. [ ] PostgreSQL is installed and running
2. [ ] Redis/Memurai is installed and running
3. [ ] Node.js v18+ is installed
4. [ ] All environment variables are set in `.env.development`
5. [ ] PostgreSQL's psql is in your system PATH

## Sequential Startup Steps

### 1. Database Setup
1. Create the database if it doesn't exist:
   ```sql
   -- Using pgAdmin or psql:
   CREATE DATABASE bulk_buyer_db;
   ```
2. Set environment variables:
   ```powershell
   $env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bulk_buyer_db"
   ```
3. Run migrations:
   ```powershell
   npx prisma migrate dev
   ```
4. Verify connection:
   ```powershell
   psql -U postgres -d bulk_buyer_db -c "SELECT 1"
   ```

### 2. Redis Setup
1. Verify Redis is running:
   ```powershell
   wsl -d Ubuntu redis-cli ping  # Should return "PONG"
   ```
2. If not running, start Redis:
   ```powershell
   wsl -d Ubuntu bash -c "sudo redis-server --daemonize yes"
   ```

### 3. Environment Cleanup
1. Stop any existing development servers:
   ```powershell
   Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
2. Clear port conflicts:
   ```powershell
   # Check ports
   netstat -ano | findstr :3000
   # Kill if needed
   taskkill /PID <process_id> /F
   ```

### 4. Development Server
1. Start the server:
   ```powershell
   $env:NODE_ENV="development"; npm run dev
   ```
2. Verify health endpoint:
   ```powershell
   curl http://localhost:3000/api/health
   ```

## Troubleshooting Guide

### Database Issues
- Error: "psql is not recognized as a command"
  ```powershell
  # Solution: Add PostgreSQL bin directory to PATH
  $env:Path += ";C:\Program Files\PostgreSQL\14\bin"
  ```

- Error: "Database does not exist"
  ```sql
  -- Solution: Create database using pgAdmin or psql
  CREATE DATABASE bulk_buyer_db;
  ```

- Error: "Prisma schema validation"
  1. Check if DATABASE_URL is set:
     ```powershell
     $env:DATABASE_URL
     ```
  2. Set DATABASE_URL if missing:
     ```powershell
     $env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bulk_buyer_db"
     ```

### Redis Issues
- Error: "Redis connection refused"
  1. Check WSL Redis status:
     ```powershell
     wsl -d Ubuntu redis-cli ping
     ```
  2. Start Redis if needed:
     ```powershell
     wsl -d Ubuntu bash -c "sudo redis-server --daemonize yes"
     ```
  3. Verify REDIS_URL in .env.development

### Port Conflicts
- Error: "Port already in use"
  1. List processes: `netstat -ano | findstr :3000`
  2. Kill process: `taskkill /PID <process_id> /F`
  3. Alternative: Let Next.js use another port automatically

## Load Testing Prerequisites
1. Ensure test user exists
2. Verify Redis connection (required for rate limiting)
3. Run smoke test

## Daily Startup Order
1. Start PostgreSQL (if not running as service)
2. Start Redis in WSL
3. Clean up any existing Node processes
4. Start development server
5. Verify all health checks pass

## Shutdown Process
1. Stop development server (Ctrl+C)
2. Stop Redis server if manually started
3. PostgreSQL service can keep running
4. Clear any temporary files if needed 