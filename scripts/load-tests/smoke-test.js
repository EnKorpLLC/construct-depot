import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 2 },    // Ramp up to 2 users
    { duration: '20s', target: 2 },    // Stay at 2 users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],   // 2s
    'http_req_failed': ['rate<0.01'],      // 1% error rate
    'checks': ['rate>0.9'],                // 90% of checks must pass
  }
};

export default function () {
  // First get CSRF token
  const csrfRes = http.get('http://localhost:3000/api/auth/csrf');
  const csrfToken = JSON.parse(csrfRes.body).csrfToken;

  // Then authenticate
  const loginData = JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword',
    csrfToken: csrfToken,
    json: true
  });

  const loginRes = http.post('http://localhost:3000/api/auth/callback/credentials', loginData, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': csrfRes.headers['Set-Cookie']
    }
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  // Extract session cookie
  const cookies = loginRes.headers['Set-Cookie'];
  const params = {
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/json'
    },
  };

  // Health check with auth
  const healthRes = http.get('http://localhost:3000/api/health', params);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Analytics endpoints with auth
  const analyticsRes = http.get('http://localhost:3000/api/analytics/orders?timeframe=week', params);
  check(analyticsRes, {
    'analytics status is 200': (r) => r.status === 200,
    'analytics response is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    'analytics response has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && typeof data === 'object';
      } catch (e) {
        console.error('Failed to parse analytics response:', e);
        return false;
      }
    },
  });

  sleep(1);
} 