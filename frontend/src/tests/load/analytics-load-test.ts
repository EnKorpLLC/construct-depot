import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export const analyticsErrors = new Rate('analytics_errors');
export const analyticsLatency = new Trend('analytics_latency');

export const options = {
  stages: [
    { duration: '10s', target: 2 },    // Ramp up to only 2 users
    { duration: '20s', target: 2 },    // Stay at 2 users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'analytics_latency': ['p(95)<1000'],
    'analytics_errors': ['rate<0.01'],
    'http_req_duration': ['p(95)<2000'],
    'checks': ['rate>0.9'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000'; // Use environment variable with fallback

export default function() {
  // Add detailed logging
  console.log('Starting test iteration');
  
  // Test authentication first
  const loginRes = http.post(`${BASE_URL}/api/auth/signin`, JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  console.log(`Login response status: ${loginRes.status}`);
  console.log(`Login response body: ${loginRes.body}`);
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  if (loginRes.status !== 200) {
    console.log('Authentication failed, skipping analytics tests');
    return;
  }
  
  // Extract session token
  const cookies = loginRes.headers['Set-Cookie'];
  console.log(`Received cookies: ${cookies}`);
  
  // Test analytics endpoints sequentially
  const endpoints = ['revenue', 'customers', 'pools', 'orders'];
  
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint} endpoint`);
    
    const response = http.get(`${BASE_URL}/api/analytics/${endpoint}?timeframe=month`, {
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`${endpoint} response status: ${response.status}`);
    console.log(`${endpoint} response body: ${response.body}`);
    
    check(response, {
      [`${endpoint} successful`]: (r) => r.status === 200,
    });
    
    analyticsLatency.add(response.timings.duration);
    analyticsErrors.add(response.status !== 200);
    
    // Add small delay between requests
    sleep(1);
  }
  
  // Cleanup - logout
  const logoutRes = http.post(`${BASE_URL}/api/auth/signout`);
  console.log(`Logout response status: ${logoutRes.status}`);
  
  sleep(2);
} 