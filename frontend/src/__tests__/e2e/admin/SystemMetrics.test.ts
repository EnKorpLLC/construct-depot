import { test, expect } from '@playwright/test';
import { setupE2ETest } from '@/lib/test/e2e-setup';
import { mockSystemMetrics } from '@/lib/test/mocks/metrics';
import { redis } from '@/lib/redis';

test.describe('System Metrics E2E Tests', () => {
  let authToken: string;

  test.beforeAll(async () => {
    // Setup test environment and get admin auth token
    const { token } = await setupE2ETest({
      role: 'SUPER_ADMIN'
    });
    authToken = token;
  });

  test.beforeEach(async () => {
    // Reset Redis metrics before each test
    await redis.flushall();
    
    // Set initial metrics
    await Promise.all([
      redis.set('system:cpu', '45.5'),
      redis.set('system:memory', '60.2'),
      redis.set('system:disk', '75.8'),
      redis.set('system:requests', '1000'),
      redis.set('system:errors', '5'),
      redis.set('system:total_requests', '1000'),
      redis.hmset('system:network', {
        bytesIn: '1000000',
        bytesOut: '2000000',
        connectionsPerSecond: '100'
      }),
      redis.hmset('system:database', {
        activeConnections: '50',
        queryResponseTime: '0.1',
        poolSize: '100',
        waitingQueries: '5'
      }),
      redis.hmset('system:cache', {
        hitRate: '95.5',
        missRate: '4.5',
        size: '1000000',
        evictions: '100'
      }),
      redis.hmset('system:queue', {
        activeJobs: '10',
        waitingJobs: '5',
        completedJobs: '1000',
        failedJobs: '2',
        processingTime: '0.5'
      })
    ]);
  });

  test('should display system metrics dashboard', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    
    // Verify authentication
    await expect(page.getByText('System Metrics')).toBeVisible();
    
    // Check initial metrics are displayed
    await expect(page.getByText('45.5%')).toBeVisible(); // CPU Usage
    await expect(page.getByText('60.2%')).toBeVisible(); // Memory Usage
    await expect(page.getByText('75.8%')).toBeVisible(); // Disk Usage
    
    // Verify network metrics
    await expect(page.getByText('1.0 MB')).toBeVisible(); // Bytes In
    await expect(page.getByText('2.0 MB')).toBeVisible(); // Bytes Out
    await expect(page.getByText('100/s')).toBeVisible(); // Connections per second
    
    // Verify database metrics
    await expect(page.getByText('50')).toBeVisible(); // Active connections
    await expect(page.getByText('0.1ms')).toBeVisible(); // Query response time
    
    // Verify cache metrics
    await expect(page.getByText('95.5%')).toBeVisible(); // Hit rate
    await expect(page.getByText('4.5%')).toBeVisible(); // Miss rate
    
    // Verify queue metrics
    await expect(page.getByText('10')).toBeVisible(); // Active jobs
    await expect(page.getByText('5')).toBeVisible(); // Waiting jobs
  });

  test('should update metrics in real-time', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Wait for initial load
    await expect(page.getByText('System Metrics')).toBeVisible();
    
    // Update metrics in Redis
    await redis.set('system:cpu', '80.0');
    await redis.set('system:memory', '85.0');
    
    // Verify updates are reflected in UI
    await expect(page.getByText('80.0%')).toBeVisible();
    await expect(page.getByText('85.0%')).toBeVisible();
  });

  test('should handle connection loss gracefully', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Simulate network disconnection
    await page.setOffline(true);
    
    // Verify disconnection message
    await expect(page.getByText('Reconnecting to metrics service...')).toBeVisible();
    
    // Restore connection
    await page.setOffline(false);
    
    // Verify metrics are restored
    await expect(page.getByText('System Metrics')).toBeVisible();
    await expect(page.getByText('45.5%')).toBeVisible();
  });

  test('should show error states correctly', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Simulate high resource usage
    await redis.set('system:cpu', '95.0');
    await redis.set('system:memory', '90.0');
    
    // Verify warning indicators
    await expect(page.getByTestId('cpu-warning')).toBeVisible();
    await expect(page.getByTestId('memory-warning')).toBeVisible();
  });

  test('should format large numbers correctly', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Set large values
    await redis.hmset('system:network', {
      bytesIn: '1073741824', // 1 GB
      bytesOut: '2147483648' // 2 GB
    });
    
    // Verify formatted values
    await expect(page.getByText('1.0 GB')).toBeVisible();
    await expect(page.getByText('2.0 GB')).toBeVisible();
  });
}); 