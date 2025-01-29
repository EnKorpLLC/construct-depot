# PowerShell script to run load tests
[CmdletBinding()]
param()

# Set environment variables
$env:API_URL = "http://localhost:3000/api"

# Define color codes for output
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red

Write-Host "Starting load tests..." -ForegroundColor $Green
Write-Host "API URL: $env:API_URL"

function Start-LoadTest {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [string]$TestFile,
        [Parameter(Mandatory=$true)]
        [string]$TestName
    )
    
    Write-Host "`nRunning $TestName load tests..." -ForegroundColor $Green
    k6 run $TestFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host "$TestName load tests completed successfully!" -ForegroundColor $Green
        return $true
    } 
    else {
        Write-Host "$TestName load tests failed with exit code $LASTEXITCODE" -ForegroundColor $Red
        return $false
    }
}

try {
    $allTestsPassed = $true
    
    # Run analytics load tests
    Write-Host "`nStarting Analytics Load Tests..." -ForegroundColor $Green
    $allTestsPassed = $allTestsPassed -and (Start-LoadTest -TestFile "src/tests/performance/analytics.perf.ts" -TestName "Analytics")

    # Run order management load tests
    Write-Host "`nStarting Order Management Load Tests..." -ForegroundColor $Green
    $allTestsPassed = $allTestsPassed -and (Start-LoadTest -TestFile "src/tests/performance/order-management.perf.ts" -TestName "Order Management")

    if ($allTestsPassed) {
        Write-Host "`nAll load tests completed successfully!" -ForegroundColor $Green
        exit 0
    } 
    else {
        Write-Host "`nSome load tests failed!" -ForegroundColor $Red
        exit 1
    }
} 
catch {
    Write-Host "Error running load tests: $_" -ForegroundColor $Red
    exit 1
} 