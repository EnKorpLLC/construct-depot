#!/usr/bin/env pwsh

# Strict mode and error preferences
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$script:hadErrors = $false

function Write-DeployMessage {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-RequiredTools {
    Write-DeployMessage "Checking required tools..." -Color "Cyan"
    
    $tools = @(
        @{Name="node"; Command="node --version"},
        @{Name="npm"; Command="npm --version"},
        @{Name="git"; Command="git --version"}
    )

    foreach ($tool in $tools) {
        try {
            $version = Invoke-Expression $tool.Command
            Write-DeployMessage "✓ $($tool.Name) found: $version" -Color "Green"
        } catch {
            Write-DeployMessage "✗ $($tool.Name) not found" -Color "Red"
            $script:hadErrors = $true
        }
    }
}

function Test-RequiredEnvVars {
    Write-DeployMessage "Checking required environment variables..." -Color "Cyan"
    
    $requiredVars = @(
        "DATABASE_URL",
        "NEXTAUTH_SECRET",
        "NEXTAUTH_URL",
        "REDIS_URL"
    )

    foreach ($var in $requiredVars) {
        if ([string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($var))) {
            Write-DeployMessage "✗ Missing required environment variable: $var" -Color "Red"
            $script:hadErrors = $true
        } else {
            Write-DeployMessage "✓ Found environment variable: $var" -Color "Green"
        }
    }
}

function Test-DatabaseConnection {
    Write-DeployMessage "Testing database connection..." -Color "Cyan"
    try {
        npx ts-node scripts/test-database-connection.ts
        if ($LASTEXITCODE -ne 0) {
            Write-DeployMessage "✗ Database connection test failed" -Color "Red"
            $script:hadErrors = $true
        }
    } catch {
        Write-DeployMessage "✗ Database connection test failed: $_" -Color "Red"
        $script:hadErrors = $true
    }
}

function Test-RedisConnection {
    Write-DeployMessage "Testing Redis connection..." -Color "Cyan"
    try {
        npx ts-node scripts/test-redis-connection.ts
        if ($LASTEXITCODE -ne 0) {
            Write-DeployMessage "✗ Redis connection test failed" -Color "Red"
            $script:hadErrors = $true
        }
    } catch {
        Write-DeployMessage "✗ Redis connection test failed: $_" -Color "Red"
        $script:hadErrors = $true
    }
}

function Start-Build {
    Write-DeployMessage "Starting production build..." -Color "Cyan"
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-DeployMessage "✗ Build failed" -Color "Red"
            $script:hadErrors = $true
        }
    } catch {
        Write-DeployMessage "✗ Build failed: $_" -Color "Red"
        $script:hadErrors = $true
    }
}

function Start-DatabaseMigration {
    Write-DeployMessage "Running database migrations..." -Color "Cyan"
    try {
        npx prisma migrate deploy
        if ($LASTEXITCODE -ne 0) {
            Write-DeployMessage "✗ Database migration failed" -Color "Red"
            $script:hadErrors = $true
        }
    } catch {
        Write-DeployMessage "✗ Database migration failed: $_" -Color "Red"
        $script:hadErrors = $true
    }
}

# Main deployment script
Write-DeployMessage "Starting deployment process..." -Color "Yellow"

# Run all checks and deployment steps
Test-RequiredTools
Test-RequiredEnvVars
Test-DatabaseConnection
Test-RedisConnection
Start-DatabaseMigration
Start-Build

# Final status check
if ($script:hadErrors) {
    Write-DeployMessage "Deployment failed! Please check the errors above." -Color "Red"
    exit 1
} else {
    Write-DeployMessage "Deployment completed successfully!" -Color "Green"
    Write-DeployMessage @"
Next steps:
1. Configure your domain in Vercel
2. Set up SSL certificates
3. Configure monitoring and alerts
4. Create the initial super admin account
"@ -Color "Cyan"
} 