import { check } from 'k6/http';
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const orderRequests = new Counter('order_requests');
const orderCreationSuccess = new Rate('order_creation_success');
const orderProcessingTime = new Trend('order_processing_time');
const poolingSuccess = new Rate('pooling_success');
const websocketConnections = new Counter('websocket_connections');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 200 },  // Ramp up to 200 users
    { duration: '3m', target: 200 },  // Stay at 200 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'order_processing_time': ['p(95)<1000'], // 95% of orders should process under 1s
    'order_creation_success': ['rate>0.95'],  // 95% success rate for order creation
    'pooling_success': ['rate>0.90'],         // 90% success rate for pooling
    'http_req_failed': ['rate<0.01'],         // Less than 1% of requests should fail
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';

// Helper to generate test data
function generateOrderData() {
  return {
    items: [
      {
        productId: `test-product-${Math.floor(Math.random() * 1000)}`,
        quantity: Math.floor(Math.random() * 5) + 1,
        unitPrice: 10.99
      }
    ],
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    },
    paymentMethod: 'test_card'
  };
}

export default function() {
  // Test order creation
  const createRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify(generateOrderData()),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'CreateOrder' }
    }
  );
  
  orderRequests.add(1);
  orderProcessingTime.add(createRes.timings.duration);
  orderCreationSuccess.add(createRes.status === 201);
  
  check(createRes, {
    'order created successfully': (r) => r.status === 201,
    'create response time OK': (r) => r.timings.duration < 1000,
  });

  if (createRes.status === 201) {
    const orderId = createRes.json('id');

    // Test order retrieval
    const getRes = http.get(
      `${BASE_URL}/orders/${orderId}`,
      { tags: { name: 'GetOrder' } }
    );
    
    check(getRes, {
      'order retrieved successfully': (r) => r.status === 200,
      'get response time OK': (r) => r.timings.duration < 500,
    });

    // Test order pooling
    const poolRes = http.post(
      `${BASE_URL}/orders/${orderId}/pool`,
      null,
      { tags: { name: 'PoolOrder' } }
    );
    
    poolingSuccess.add(poolRes.status === 200);
    
    check(poolRes, {
      'order pooled successfully': (r) => r.status === 200,
      'pool response time OK': (r) => r.timings.duration < 1000,
    });

    // Test order list with filters
    const listRes = http.get(
      `${BASE_URL}/orders?status=pooling&limit=10`,
      { tags: { name: 'ListOrders' } }
    );
    
    check(listRes, {
      'orders listed successfully': (r) => r.status === 200,
      'list response time OK': (r) => r.timings.duration < 500,
    });

    // Test order search
    const searchRes = http.get(
      `${BASE_URL}/orders/search?q=test&limit=10`,
      { tags: { name: 'SearchOrders' } }
    );
    
    check(searchRes, {
      'orders searched successfully': (r) => r.status === 200,
      'search response time OK': (r) => r.timings.duration < 800,
    });
  }

  // Test WebSocket connection for real-time updates
  const ws = http.get(`${BASE_URL}/ws`);
  websocketConnections.add(1);
  
  check(ws, {
    'websocket connection OK': (r) => r.status === 101,
    'websocket response time OK': (r) => r.timings.duration < 100,
  });

  sleep(1);
} 