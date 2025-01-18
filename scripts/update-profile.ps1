#!/usr/bin/env pwsh

# Strict mode and error preferences
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-ProfileMessage {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Define the environment variables
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

# Get the PowerShell profile path
$profilePath = $PROFILE
$profileDir = Split-Path -Parent $profilePath

# Create profile directory if it doesn't exist
if (-not (Test-Path $profileDir)) {
    Write-ProfileMessage "Creating PowerShell profile directory..." -Color "Yellow"
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Create or append to profile
Write-ProfileMessage "Updating PowerShell profile..." -Color "Cyan"

$profileContent = @"

# Bulk Buyer Group Development Environment Variables
Write-Host "Setting up Bulk Buyer Group development environment..." -ForegroundColor Cyan
"@

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    $profileContent += "`n[Environment]::SetEnvironmentVariable('$key', '$value', 'Process')"
}

$profileContent += "`nWrite-Host 'Development environment variables set!' -ForegroundColor Green`n"

# Check if profile exists
if (Test-Path $profilePath) {
    # Check if our variables are already in the profile
    $currentProfile = Get-Content $profilePath -Raw
    if ($currentProfile -notlike "*Bulk Buyer Group Development Environment Variables*") {
        Write-ProfileMessage "Appending environment variables to existing profile..." -Color "Yellow"
        Add-Content -Path $profilePath -Value $profileContent
    } else {
        Write-ProfileMessage "Environment variables already exist in profile" -Color "Yellow"
    }
} else {
    Write-ProfileMessage "Creating new PowerShell profile..." -Color "Yellow"
    Set-Content -Path $profilePath -Value $profileContent
}

Write-ProfileMessage "PowerShell profile updated successfully!" -Color "Green"
Write-ProfileMessage "Note: You'll need to restart your PowerShell session or run '. $PROFILE' for changes to take effect" -Color "Cyan" 