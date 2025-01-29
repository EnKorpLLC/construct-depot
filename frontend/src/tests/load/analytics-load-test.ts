import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const analyticsLatency = new Trend('analytics_latency');
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    'analytics_latency': ['p95<500'],  // 95% of requests should be below 500ms
    'errors': ['rate<0.01'],           // Error rate should be below 1%
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || 'testpass123';

export function setup() {
  // Login to get auth token
  const loginRes = http.post(`${API_URL}/api/auth/login`, {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  check(loginRes, {
    'logged in successfully': (r) => r.status === 200,
  });

  return { authToken: loginRes.json('token') };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json',
  };

  // Track event
  const eventStart = Date.now();
  const eventRes = http.post(`${API_URL}/api/analytics/events`, {
    type: 'TEST_EVENT',
    metadata: { timestamp: new Date().toISOString() }
  }, { headers });

  analyticsLatency.add(Date.now() - eventStart);
  
  check(eventRes, {
    'event tracked successfully': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Generate report
  const reportStart = Date.now();
  const reportRes = http.get(`${API_URL}/api/analytics/reports/daily`, { headers });

  analyticsLatency.add(Date.now() - reportStart);
  
  check(reportRes, {
    'report generated successfully': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

// Monitoring Points
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    './analytics-test-results.json': JSON.stringify(data)
  };
} 