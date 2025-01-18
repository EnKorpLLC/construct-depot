# Load Testing Strategy

## Pre-Test Requirements

### 1. Environment Verification
1. Database
   - PostgreSQL service running
   - Database exists and is accessible
   - Migrations are up to date

2. Redis (WSL2)
   ```powershell
   # Verify Redis is running
   wsl -d Ubuntu redis-cli ping
   
   # Start if needed
   wsl -d Ubuntu bash -c "sudo redis-server --daemonize yes"
   ```

3. Environment Variables
   - Verify all variables in `.env.development`
   - Ensure correct database URL
   - Confirm Redis URL points to WSL2 instance

### 2. Environment Cleanup
1. Stop existing processes:
   ```powershell
   # Run the comprehensive cleanup script
   ./scripts/cleanup.ps1
   ```

2. Verify ports are available:
   ```powershell
   netstat -ano | findstr :3000
   ```

### 3. Health Check Verification
1. Start development server:
   ```powershell
   $env:NODE_ENV="development"; npm run dev
   ```

2. Verify endpoints:
   - Health check endpoint responding
   - CSRF token generation working
   - Authentication endpoints accessible
   - Test user can log in

## Analytics API Load Testing

### Phase 0: Smoke Test
- Run minimal test with 2 concurrent users for 40 seconds
- Success criteria:
  - All authentication requests succeed
  - All API endpoints respond
  - No connection timeouts
  - Error rate 0%
- If smoke test fails:
  - Check server logs
  - Verify authentication flow
  - Confirm port configuration
  - Review error messages

### Phase 1: Initial Validation
- Only proceed if smoke test passes
- Run small batch tests with 10 concurrent users for 1.5 minutes
- Success criteria:
  - 95% of requests complete under 1s
  - Error rate below 1%
  - 90% of all checks pass
  - Request duration under 2s for 95% of requests
- If Phase 1 fails:
  - Review server logs
  - Check database and Redis connections
  - Fix identified issues before proceeding

### Phase 2: Scale Testing (Medium Batch)
Only proceed if Phase 1 passes:
- Run medium batch tests with 100 concurrent users for 5 minutes
- Success criteria:
  - 95% of requests complete under 2s
  - Error rate below 2%
  - 85% of all checks pass

### Phase 3: Production Load (Full Scale)
Only proceed if Phase 2 passes:
- Run full scale tests with 300 concurrent users for 15 minutes
- Success criteria:
  - 95% of requests complete under 3s
  - Error rate below 5%
  - 80% of all checks pass

### Test Configuration
```typescript
// Smoke Test Configuration
{
  stages: [
    { duration: '10s', target: 2 },    // Ramp up to 2 users
    { duration: '20s', target: 2 },    // Stay at 2 users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'analytics_latency': ['p(95)<1000'],  // 1s
    'analytics_errors': ['rate<0.01'],     // 1%
    'http_req_duration': ['p(95)<2000'],   // 2s
    'checks': ['rate>0.9'],               // 90%
  }
}

// Phase 1 Configuration
{
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '30s', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'analytics_latency': ['p(95)<1000'],  // 1s
    'analytics_errors': ['rate<0.01'],     // 1%
    'http_req_duration': ['p(95)<2000'],   // 2s
    'checks': ['rate>0.9'],               // 90%
  }
}

// Phase 2 Configuration
{
  stages: [
    { duration: '1m', target: 100 },    // Ramp up to 100
    { duration: '3m', target: 100 },    // Stay at 100
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    'analytics_latency': ['p(95)<2000'],  // 2s
    'analytics_errors': ['rate<0.02'],     // 2%
    'http_req_duration': ['p(95)<3000'],   // 3s
    'checks': ['rate>0.85'],              // 85%
  }
}

// Phase 3 Configuration
{
  stages: [
    { duration: '2m', target: 300 },    // Ramp up to 300
    { duration: '10m', target: 300 },   // Stay at 300
    { duration: '3m', target: 0 },      // Ramp down
  ],
  thresholds: {
    'analytics_latency': ['p(95)<3000'],  // 3s
    'analytics_errors': ['rate<0.05'],     // 5%
    'http_req_duration': ['p(95)<4000'],   // 4s
    'checks': ['rate>0.80'],              // 80%
  }
}
```

### Test Execution Process
1. Pre-test Environment Cleanup:
   ```powershell
   # Windows PowerShell - Process Cleanup
   Get-Process -Name node,npm,k6 -ErrorAction SilentlyContinue | Stop-Process -Force
   
   # Port Verification
   Get-NetTCPConnection -LocalPort 3000,3001,3002,3003,3004 -ErrorAction SilentlyContinue |
     Select-Object LocalPort,State,OwningProcess
   
   # Environment Reset
   Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
   Remove-Item Env:PORT -ErrorAction SilentlyContinue
   ```

2. Environment Verification:
   - Verify no stray Node.js processes
   - Check all required ports are available
   - Confirm environment variables
   - Verify test user exists in database

3. Start Development Server:
   ```powershell
   # Windows PowerShell
   $env:NODE_ENV="development"
   npm run dev
   ```

4. Health Check Verification:
   - Call health check endpoint
   - Verify database connection
   - Check Redis connectivity
   - Monitor system resources

5. Execute Tests:
   - Start with smoke test
   - Monitor server logs
   - Check error messages
   - Verify authentication flow
   - Document all issues

6. Post-Test Analysis:
   - Review error logs
   - Check performance metrics
   - Analyze authentication issues
   - Document findings

### Monitoring Points
- Server response times
- Error rates and types
- Database query performance
- Redis cache hit/miss rates
- Authentication success rates
- Resource utilization
- Connection timeouts
- Port conflicts

### Error Handling
1. Authentication Failures:
   - Log full request/response
   - Check session management
   - Verify token handling
   - Monitor cookie usage

2. Connection Issues:
   - Verify correct port usage
   - Check server status
   - Monitor process conflicts
   - Log connection attempts

3. Performance Issues:
   - Monitor database queries
   - Check Redis performance
   - Track system resources
   - Log response times

### Recovery Procedures
1. Server Issues:
   - Stop all Node.js processes
   - Clear port bindings
   - Reset environment
   - Restart development server

2. Database Issues:
   - Check connection pool
   - Verify credentials
   - Monitor query performance
   - Reset connections if needed

3. Authentication Issues:
   - Clear session data
   - Reset test user
   - Verify credentials
   - Check token handling

### Post-Test Cleanup
1. Automated Process Cleanup:
   - Stop all test processes
   - Clear test data
   - Reset database state
   ```powershell
   # Windows PowerShell
   Get-Process -Name node | Stop-Process -Force
   Get-Process -Name "k6*" | Stop-Process -Force
   ```
   ```bash
   # Linux/WSL
   pkill -f "node"
   pkill -f "k6"
   ```

2. Database and Cache Cleanup:
   ```sql
   -- Reset analytics tables
   TRUNCATE analytics_metrics CASCADE;
   TRUNCATE analytics_events CASCADE;
   ```
   ```bash
   # Clear Redis cache
   redis-cli FLUSHDB
   ```

3. Port and Socket Cleanup:
   ```powershell
   # Windows PowerShell - Check and kill processes on ports
   $ports = 3000..3004
   foreach($port in $ports) {
     $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
     if($proc) {
       Stop-Process -Id $proc.OwningProcess -Force
     }
   }
   
   # Check for lingering .next directory locks
   Remove-Item -Path ".next/cache" -Recurse -Force -ErrorAction SilentlyContinue
   ```
   ```bash
   # Linux/WSL - Check and kill processes on ports
   for port in {3000..3004}; do
     fuser -k $port/tcp
   done
   
   # Clean .next directory
   rm -rf .next/cache
   ```

4. Environment Cleanup:
   ```powershell
   # Windows PowerShell - Reset environment variables
   Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
   Remove-Item Env:PORT -ErrorAction SilentlyContinue
   ```
   ```bash
   # Linux/WSL - Reset environment variables
   unset NODE_ENV
   unset PORT
   ```

5. Process Cleanup Verification:
   ```powershell
   # Windows PowerShell - Comprehensive process check
   $processNames = @('node', 'k6', 'npm')
   foreach($name in $processNames) {
     $procs = Get-Process -Name $name -ErrorAction SilentlyContinue
     if($procs) {
       Write-Host "Warning: Found running $name processes"
       $procs | Format-Table Id, ProcessName, StartTime
     }
   }
   
   # Verify ports are free
   Get-NetTCPConnection -LocalPort 3000,3001,3002,3003,3004 -ErrorAction SilentlyContinue | 
     Select-Object LocalPort,State,OwningProcess
   
   # Check for lock files
   if(Test-Path ".next/cache/lock") {
     Write-Host "Warning: Next.js lock file exists"
   }
   ```

6. Temporary Files Cleanup:
   ```powershell
   # Windows PowerShell
   Remove-Item "npm-debug.log" -ErrorAction SilentlyContinue
   Remove-Item ".next/cache/lock" -ErrorAction SilentlyContinue
   Remove-Item "*.log" -ErrorAction SilentlyContinue
   ```
   ```bash
   # Linux/WSL
   rm -f npm-debug.log
   rm -f .next/cache/lock
   rm -f *.log
   ```

### Monitoring Points
- Server response times
- Error rates and types
- Database query performance
- Redis cache hit/miss rates
- Authentication success rates
- Resource utilization (CPU, Memory, Network)

### Strategy Optimizations

#### 1. Streamlined Testing Process
- Start with minimal batch size (2-3 users) when debugging critical issues
- Add comprehensive error logging before running larger batches
- Test endpoints sequentially rather than in parallel when investigating issues
- Implement pre-test health checks for all required services
- Add request/response logging for failed tests
- Use standard NODE_ENV values:
  - Use 'development' for local testing
  - Use 'production' for production load tests
  - Avoid non-standard environment values

#### 2. Resource Management
- Standardize development server port usage (avoid multiple instances)
- Implement connection pooling for database and Redis
- Add Redis cache metrics to monitoring:
  - Cache hit ratio
  - Memory usage
  - Eviction rate
- Set resource limits per test phase

#### 3. Testing Efficiency Improvements
- Add smoke tests before Phase 1:
  - Single user authentication test
  - Basic CRUD operations check
  - Service connectivity verification
- Implement automated health checks between phases
- Add circuit breakers to prevent resource exhaustion:
  - Max concurrent connections
  - Request timeout limits
  - Error rate thresholds
- Automated cleanup between test runs 

### Environment Setup Requirements
1. **Node Environment Configuration**
   - Use `NODE_ENV=development` for local development and initial testing
   - Use `NODE_ENV=production` for production load testing
   - Create separate `.env.development` and `.env.production` files
   - Never use non-standard NODE_ENV values to avoid Next.js inconsistencies

2. **Test Data Configuration**
   - Use test data through database seeding
   - Configure test users in the standard environments
   - Use environment variables for test credentials

3. **Local Development Setup**
   - Run development server with `next dev` (uses correct NODE_ENV)
   - Use separate terminal for load testing execution
   - Ensure clean environment before each test run

4. **Environment Variables**
   ```bash
   # .env.development
   NEXT_PUBLIC_API_URL=http://localhost:3000
   DATABASE_URL=...
   REDIS_URL=...
   
   # .env.production
   NEXT_PUBLIC_API_URL=http://localhost:3000
   DATABASE_URL=...
   REDIS_URL=...
   ``` 