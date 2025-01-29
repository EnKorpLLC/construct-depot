#!/usr/bin/env pwsh

# Strict mode and error preferences
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$script:hadErrors = $false

function Write-SetupMessage {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 1. Run cleanup first
Write-SetupMessage "Running environment cleanup..." -Color "Yellow"
try {
    & "$PSScriptRoot\cleanup.ps1"
} catch {
    Write-SetupMessage "Cleanup failed but continuing with setup..." -Color "Yellow"
}

# 2. Set up environment variables
Write-SetupMessage "Setting up environment variables..." -Color "Cyan"
$envVars = @{
    "NODE_ENV" = "development"
    "DATABASE_URL" = "postgresql://postgres:postgres@localhost:5432/construct_depot"
    "NEXT_PUBLIC_APP_URL" = "http://localhost:3000"
    "NEXTAUTH_URL" = "http://localhost:3000"
    "NEXTAUTH_SECRET" = "dev_secret_key_please_change_in_production"
    "REDIS_URL" = "redis://localhost:6379"
    "POSTGRES_DB" = "construct_depot"
    "POSTGRES_USER" = "postgres"
    "POSTGRES_PASSWORD" = "postgres"
}

# Set environment variables for current session
foreach ($key in $envVars.Keys) {
    [Environment]::SetEnvironmentVariable($key, $envVars[$key], "Process")
    Write-SetupMessage "Set $key" -Color "Green"
}

# 3. Start Docker containers
Write-SetupMessage "Starting Docker containers..." -Color "Cyan"
try {
    docker-compose up -d
    Write-SetupMessage "Docker containers started successfully" -Color "Green"
} catch {
    Write-SetupMessage "Failed to start Docker containers: $_" -Color "Red"
    exit 1
}

# 4. Wait for services to be ready
Write-SetupMessage "Waiting for services to be ready..." -Color "Yellow"
$maxAttempts = 30
$attempt = 0
$servicesReady = $false

while (-not $servicesReady -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        # Check PostgreSQL
        $pgStatus = docker exec bulkbuyergroup-postgres-1 pg_isready
        if ($LASTEXITCODE -ne 0) {
            throw "PostgreSQL is not ready"
        }
        
        # Check Redis
        $redisStatus = docker exec bulkbuyergroup-redis-1 redis-cli ping
        if ($redisStatus -ne "PONG") {
            throw "Redis is not ready"
        }
        
        # Log PostgreSQL readiness
        Write-SetupMessage "PostgreSQL is ready: $pgStatus" -Color "Blue"
        # Log Redis readiness
        Write-SetupMessage "Redis is ready: $redisStatus" -Color "Blue"
        $servicesReady = $true
        Write-SetupMessage "Services are ready!" -Color "Green"
    } catch {
        Write-SetupMessage "Waiting for services... (Attempt $attempt of $maxAttempts)" -Color "Yellow"
        Start-Sleep -Seconds 1
    }
}

if (-not $servicesReady) {
    Write-SetupMessage "Services failed to start in time" -Color "Red"
    exit 1
}

# 5. Run database migrations
Write-SetupMessage "Running database migrations..." -Color "Cyan"
try {
    npx prisma migrate deploy
    Write-SetupMessage "Database migrations completed" -Color "Green"
} catch {
    Write-SetupMessage "Failed to run migrations: $_" -Color "Red"
    exit 1
}

# 6. Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-SetupMessage "Installing dependencies..." -Color "Cyan"
    try {
        npm install
        Write-SetupMessage "Dependencies installed" -Color "Green"
    } catch {
        Write-SetupMessage "Failed to install dependencies: $_" -Color "Red"
        exit 1
    }
}

# 7. Generate Prisma Client
Write-SetupMessage "Generating Prisma Client..." -Color "Cyan"
try {
    npx prisma generate
    Write-SetupMessage "Prisma Client generated" -Color "Green"
} catch {
    Write-SetupMessage "Failed to generate Prisma Client: $_" -Color "Red"
    exit 1
}

Write-SetupMessage "Development environment setup complete!" -Color "Green"
Write-SetupMessage "Next steps:" -Color "Cyan"
Write-SetupMessage "1. Run 'npm run dev' to start the development server" -Color "Cyan"
Write-SetupMessage "2. Visit http://localhost:3000 to verify the application" -Color "Cyan"
Write-SetupMessage "3. Check the console for any additional warnings" -Color "Cyan" 