import { check } from 'k6/http';
import http from 'k6/http';
import { sleep } from 'k6';
import { OrderStatus } from '../../models/order/Order';

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';

// Helper to generate test data
function generateOrderData() {
  return {
    userId: 'test-user-id',
    items: [
      {
        productId: 'test-product-id',
        quantity: Math.floor(Math.random() * 5) + 1,
        unitPrice: 10.99
      }
    ]
  };
}

export default function() {
  // Test creating orders
  const createRes = http.post(`${BASE_URL}/orders`, JSON.stringify(generateOrderData()), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(createRes, {
    'order created successfully': (r) => r.status === 201,
    'create response time OK': (r) => r.timings.duration < 500,
  });

  const orderId = createRes.json('id');

  // Test retrieving orders
  const getRes = http.get(`${BASE_URL}/orders/${orderId}`);
  check(getRes, {
    'order retrieved successfully': (r) => r.status === 200,
    'get response time OK': (r) => r.timings.duration < 200,
  });

  // Test listing orders with filters
  const listRes = http.get(`${BASE_URL}/orders?status=${OrderStatus.DRAFT}`);
  check(listRes, {
    'orders listed successfully': (r) => r.status === 200,
    'list response time OK': (r) => r.timings.duration < 300,
  });

  // Test updating order status
  const updateRes = http.put(`${BASE_URL}/orders/${orderId}`, JSON.stringify({
    status: OrderStatus.POOLING
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(updateRes, {
    'order updated successfully': (r) => r.status === 200,
    'update response time OK': (r) => r.timings.duration < 400,
  });

  // Test WebSocket connection
  const wsRes = http.get(`${BASE_URL}/ws`);
  check(wsRes, {
    'websocket connection OK': (r) => r.status === 101,
    'websocket response time OK': (r) => r.timings.duration < 100,
  });

  sleep(1);
}

// Custom metrics
const orderCreationTrend = new Trend('order_creation_duration');
const orderUpdateTrend = new Trend('order_update_duration');
const wsConnectionTrend = new Trend('websocket_connection_duration');

// Custom thresholds
export const thresholds = {
  order_creation_duration: ['p(95)<600'],
  order_update_duration: ['p(95)<400'],
  websocket_connection_duration: ['p(95)<150'],
}; 