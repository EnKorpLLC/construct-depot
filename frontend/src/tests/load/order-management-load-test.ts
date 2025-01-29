import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const orderLatency = new Trend('order_latency');
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 30 },  // Ramp up to 30 users
    { duration: '3m', target: 30 },  // Stay at 30 users
    { duration: '1m', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    'order_latency': ['p95<500'],    // 95% of requests should be below 500ms
    'errors': ['rate<0.01'],         // Error rate should be below 1%
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

  // Create order
  const orderStart = Date.now();
  const orderRes = http.post(`${API_URL}/api/orders`, {
    items: [
      { productId: '1', quantity: 2 },
      { productId: '2', quantity: 1 }
    ],
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip: '12345'
    }
  }, { headers });

  orderLatency.add(Date.now() - orderStart);
  
  check(orderRes, {
    'order created successfully': (r) => r.status === 201,
  }) || errorRate.add(1);

  if (orderRes.status === 201) {
    const orderId = orderRes.json('order.id');

    // Get order details
    const detailsStart = Date.now();
    const detailsRes = http.get(`${API_URL}/api/orders/${orderId}`, { headers });

    orderLatency.add(Date.now() - detailsStart);
    
    check(detailsRes, {
      'order details retrieved successfully': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Update order status
    const updateStart = Date.now();
    const updateRes = http.patch(`${API_URL}/api/orders/${orderId}`, {
      status: 'PROCESSING'
    }, { headers });

    orderLatency.add(Date.now() - updateStart);
    
    check(updateRes, {
      'order status updated successfully': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(1);
}

// Monitoring Points
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    './load-test-results.json': JSON.stringify(data),
  };
} 