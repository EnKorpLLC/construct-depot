# Set environment variables
$env:REDIS_URL = "redis://localhost:6379"
$env:CACHE_TTL = "3600"
$env:CACHE_PREFIX = "bbg:"

Write-Host "Environment variables set:"
Write-Host "REDIS_URL: $env:REDIS_URL"
Write-Host "CACHE_TTL: $env:CACHE_TTL"
Write-Host "CACHE_PREFIX: $env:CACHE_PREFIX"

# Run cache warming
Write-Host "`nStarting cache warming..."
npm run warm-cache 