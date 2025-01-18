#!/usr/bin/env pwsh

# Strict mode and error preferences
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$script:hadErrors = $false

function Write-CleanupMessage {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-CleanupMessage "Starting optimized cleanup..." -Color "Cyan"

# Parallel cleanup tasks
$jobs = @()

# 1. Process Cleanup (Run in parallel)
$jobs += Start-Job -ScriptBlock {
    Get-Process -Name "node","npm","k6" -ErrorAction SilentlyContinue | 
        Stop-Process -Force -ErrorAction SilentlyContinue
}

# 2. Port Cleanup (Run in parallel)
$jobs += Start-Job -ScriptBlock {
    $ports = 3000..3004
    foreach($port in $ports) {
        Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
}

# 3. Critical Cache Cleanup (Run in parallel)
$jobs += Start-Job -ScriptBlock {
    $criticalPaths = @(".next/cache", "node_modules/.cache")
    foreach($path in $criticalPaths) {
        if(Test-Path $path) {
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# 4. Quick Temp File Cleanup (Run in parallel)
$jobs += Start-Job -ScriptBlock {
    Get-ChildItem -Path "." -Include "*.tmp","*.log","dump.rdb","*.lock" -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { -not $_.FullName.Contains("node_modules") } |
        Remove-Item -Force -ErrorAction SilentlyContinue
}

# Wait for all jobs to complete
Write-CleanupMessage "Running cleanup tasks..." -Color "Yellow"
$jobs | Wait-Job | Receive-Job

# 5. Quick Environment Check
if(-not (Test-Path -Path ".env.development") -and (Test-Path -Path ".env.example")) {
    Copy-Item -Path ".env.example" -Destination ".env.development" -ErrorAction SilentlyContinue
    Write-CleanupMessage "Created .env.development from example" -Color "Green"
}

Write-CleanupMessage "Cleanup complete!" -Color "Green"
Write-CleanupMessage "Run 'npm run dev' to start the development server" -Color "Cyan"
exit 0 