import { check } from 'k6/http';
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const analyticsRequests = new Counter('analytics_requests');
const cacheHitRate = new Rate('cache_hit_rate');
const analyticsLatency = new Trend('analytics_latency');
const websocketConnections = new Counter('websocket_connections');

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'analytics_latency': ['p(95)<500'], // 95% of requests should be below 500ms
    'cache_hit_rate': ['rate>0.8'],     // Cache hit rate should be above 80%
    'http_req_failed': ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';
const timeframes = ['week', 'month', 'year'];

export default function() {
  // Test order metrics endpoint
  for (const timeframe of timeframes) {
    const orderMetricsRes = http.get(`${BASE_URL}/analytics/orders?timeframe=${timeframe}`, {
      tags: { name: 'OrderMetrics' },
    });
    
    analyticsRequests.add(1);
    
    if (orderMetricsRes.status === 200) {
        analyticsLatency.add(orderMetricsRes.timings.duration);
        
        check(orderMetricsRes, {
            'order metrics response time OK': (r) => r.timings.duration < 500,
        });
    }
    
    check(orderMetricsRes, {
        'order metrics status is 200': (r) => r.status === 200,
    });

    // Check cache headers
    const cacheHit = orderMetricsRes.headers['x-cache'] === 'HIT';
    cacheHitRate.add(cacheHit ? 1 : 0);
  }

  // Test customer metrics endpoint
  for (const timeframe of timeframes) {
    const customerMetricsRes = http.get(`${BASE_URL}/analytics/customers?timeframe=${timeframe}`, {
      tags: { name: 'CustomerMetrics' },
    });
    
    analyticsRequests.add(1);
    analyticsLatency.add(customerMetricsRes.timings.duration);
    
    check(customerMetricsRes, {
      'customer metrics status is 200': (r) => r.status === 200,
      'customer metrics response time OK': (r) => r.timings.duration < 500,
    });
  }

  // Test revenue metrics endpoint
  for (const timeframe of timeframes) {
    const revenueMetricsRes = http.get(`${BASE_URL}/analytics/revenue?timeframe=${timeframe}`, {
      tags: { name: 'RevenueMetrics' },
    });
    
    analyticsRequests.add(1);
    analyticsLatency.add(revenueMetricsRes.timings.duration);
    
    check(revenueMetricsRes, {
      'revenue metrics status is 200': (r) => r.status === 200,
      'revenue metrics response time OK': (r) => r.timings.duration < 500,
    });
  }

  // Test report generation
  const reportConfig = {
    name: 'Performance Test Report',
    type: 'PERFORMANCE',
    metrics: ['orders', 'revenue', 'customers'],
    dimensions: ['time', 'category'],
    filters: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
    format: 'JSON'
  };

  const reportRes = http.post(`${BASE_URL}/analytics/reports`, JSON.stringify(reportConfig), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'ReportGeneration' },
  });

  analyticsRequests.add(1);
  analyticsLatency.add(reportRes.timings.duration);

  check(reportRes, {
    'report generation status is 200': (r) => r.status === 200,
    'report generation response time OK': (r) => r.timings.duration < 1000,
  });

  // Test WebSocket connection for real-time analytics
  const ws = http.get(`${BASE_URL}/ws`);
  websocketConnections.add(1);
  
  check(ws, {
    'websocket connection OK': (r) => r.status === 101,
    'websocket response time OK': (r) => r.timings.duration < 100,
  });

  sleep(1);
} 