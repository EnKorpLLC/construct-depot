import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at peak load
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'],             // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.API_URL || 'https://api.bulkbuyergroup.com';

export default function () {
  // Create Order
  const createPayload = {
    items: [
      { productId: 'test-product-1', quantity: 2 },
      { productId: 'test-product-2', quantity: 1 }
    ],
    deliveryAddress: '123 Test St',
    userId: 'test-user-1'
  };

  const createRes = http.post(`${BASE_URL}/api/orders`, JSON.stringify(createPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(createRes, {
    'order created successfully': (r) => r.status === 201,
  }) || errorRate.add(1);

  sleep(1);

  // Get Order
  const orderId = createRes.json('id');
  const getRes = http.get(`${BASE_URL}/api/orders/${orderId}`);

  check(getRes, {
    'order retrieved successfully': (r) => r.status === 200,
    'order data is valid': (r) => r.json('id') === orderId,
  }) || errorRate.add(1);

  sleep(1);

  // Update Order
  const updatePayload = {
    status: 'PROCESSING'
  };

  const updateRes = http.patch(`${BASE_URL}/api/orders/${orderId}`, JSON.stringify(updatePayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(updateRes, {
    'order updated successfully': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
} 