import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const successRate = new Rate('success_rate');
const requestDuration = new Trend('request_duration');
const requestsPerSecond = new Counter('requests_per_second');

// Test configuration
export const options = {
  setupTimeout: '120s',
  stages: [
    { duration: '30s', target: 10 },  // Start with 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 25 },  // Ramp up to 25 users
    { duration: '1m', target: 25 },   // Stay at 25 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% of requests should be below 1s
    'error_rate': ['rate<0.1'],          // Error rate should be below 10%
    'success_rate': ['rate>0.9'],        // Success rate should be above 90%
    'requests_per_second': ['count>10'],  // Should handle at least 10 RPS initially
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test setup
export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: __ENV.TEST_USER_EMAIL || 'test@example.com',
    password: __ENV.TEST_USER_PASSWORD || 'testpassword',
  });
  
  check(loginRes, {
    'logged in successfully': (r) => r.status === 200,
  });
  
  return {
    token: loginRes.json('token'),
  };
}

// Main test function
export default function(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  // Test group: API endpoints
  {
    // Products API
    const productsRes = http.get(`${BASE_URL}/api/products`, params);
    check(productsRes, {
      'products status is 200': (r) => r.status === 200,
      'products response time OK': (r) => r.timings.duration < 500,
    });
    requestDuration.add(productsRes.timings.duration);
    requestsPerSecond.add(1);
    errorRate.add(productsRes.status !== 200);
    successRate.add(productsRes.status === 200);

    // Orders API
    const ordersRes = http.get(`${BASE_URL}/api/orders`, params);
    check(ordersRes, {
      'orders status is 200': (r) => r.status === 200,
      'orders response time OK': (r) => r.timings.duration < 500,
    });
    requestDuration.add(ordersRes.timings.duration);
    requestsPerSecond.add(1);
    errorRate.add(ordersRes.status !== 200);
    successRate.add(ordersRes.status === 200);

    // Analytics API
    const analyticsRes = http.get(`${BASE_URL}/api/analytics/metrics`, params);
    check(analyticsRes, {
      'analytics status is 200': (r) => r.status === 200,
      'analytics response time OK': (r) => r.timings.duration < 500,
    });
    requestDuration.add(analyticsRes.timings.duration);
    requestsPerSecond.add(1);
    errorRate.add(analyticsRes.status !== 200);
    successRate.add(analyticsRes.status === 200);
  }

  // Test group: Cache performance
  {
    // Cached endpoints
    const cachedRes = http.get(`${BASE_URL}/api/products/popular`, params);
    check(cachedRes, {
      'cached response status is 200': (r) => r.status === 200,
      'cached response time OK': (r) => r.timings.duration < 100, // Cached responses should be faster
      'cache header present': (r) => r.headers['X-Cache'] !== undefined,
    });
    requestDuration.add(cachedRes.timings.duration);
    requestsPerSecond.add(1);
    errorRate.add(cachedRes.status !== 200);
    successRate.add(cachedRes.status === 200);
  }

  // Test group: Rate limiting
  {
    // Rapid requests to rate-limited endpoint
    for (let i = 0; i < 10; i++) {
      const rateLimitRes = http.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'test123',
      });
      check(rateLimitRes, {
        'rate limit working': (r) => i < 5 ? r.status === 200 : r.status === 429,
      });
      requestsPerSecond.add(1);
    }
  }

  // Test group: WebSocket connection
  {
    // WebSocket tests would go here, but k6 doesn't support WebSocket protocol
    // We'll need to test WebSocket performance separately
  }

  sleep(1); // Wait 1 second between iterations
}

// Test teardown
export function teardown(data) {
  // Cleanup: Logout
  const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, {
    headers: {
      'Authorization': `Bearer ${data.token}`,
    },
  });
  
  check(logoutRes, {
    'logged out successfully': (r) => r.status === 200,
  });
} 