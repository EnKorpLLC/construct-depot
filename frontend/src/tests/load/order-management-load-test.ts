import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics for order management
const orderLatency = new Trend('order_latency');
const orderErrors = new Rate('order_errors');
const orderCreations = new Counter('order_creations');
const orderUpdates = new Counter('order_updates');
const concurrentOrders = new Counter('concurrent_orders');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 150 },  // Ramp up to 150 users
    { duration: '5m', target: 150 },  // Stay at 150 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'order_latency': ['p(95)<300'],    // 95% of requests should be under 300ms
    'order_errors': ['rate<0.01'],     // Error rate should be below 1%
    'http_req_duration': ['p(95)<500'], // 95% of requests should be under 500ms
  },
};

// Test setup
export function setup() {
  const loginRes = http.post(`${__ENV.API_URL}/api/auth/login`, {
    email: __ENV.TEST_USER_EMAIL,
    password: __ENV.TEST_USER_PASSWORD,
  });
  
  check(loginRes, {
    'logged in successfully': (r) => r.status === 200,
  });
  
  return { token: loginRes.json('token') };
}

// Main test function
export default function(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  // Test group: Order Creation and Listing
  {
    // List orders
    const listRes = http.get(`${__ENV.API_URL}/api/orders`, params);
    check(listRes, {
      'list orders 200': (r) => r.status === 200,
      'orders data valid': (r) => Array.isArray(r.json('orders')),
    });
    orderLatency.add(listRes.timings.duration);
    orderErrors.add(listRes.status !== 200);

    // Create new order
    const createRes = http.post(`${__ENV.API_URL}/api/orders`, {
      items: [
        { productId: 'test-product-1', quantity: 5 },
        { productId: 'test-product-2', quantity: 3 },
      ],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
      },
    }, params);
    check(createRes, {
      'create order 200': (r) => r.status === 200,
      'order created successfully': (r) => r.json('id') !== undefined,
    });
    orderLatency.add(createRes.timings.duration);
    orderErrors.add(createRes.status !== 200);
    orderCreations.add(1);
    
    if (createRes.status === 200) {
      const orderId = createRes.json('id');
      concurrentOrders.add(1);

      // Update order status
      const updateRes = http.patch(`${__ENV.API_URL}/api/orders/${orderId}`, {
        status: 'processing',
      }, params);
      check(updateRes, {
        'update order 200': (r) => r.status === 200,
        'status updated': (r) => r.json('status') === 'processing',
      });
      orderLatency.add(updateRes.timings.duration);
      orderErrors.add(updateRes.status !== 200);
      orderUpdates.add(1);

      // Get order details
      const detailsRes = http.get(`${__ENV.API_URL}/api/orders/${orderId}`, params);
      check(detailsRes, {
        'get order 200': (r) => r.status === 200,
        'order details valid': (r) => r.json('id') === orderId,
      });
      orderLatency.add(detailsRes.timings.duration);
      orderErrors.add(detailsRes.status !== 200);
    }
  }

  // Test group: Order Search and Filtering
  {
    // Search orders
    const searchRes = http.get(`${__ENV.API_URL}/api/orders/search`, {
      ...params,
      params: {
        status: 'processing',
        fromDate: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
        toDate: new Date().toISOString(),
      },
    });
    check(searchRes, {
      'search orders 200': (r) => r.status === 200,
      'search results valid': (r) => Array.isArray(r.json('orders')),
    });
    orderLatency.add(searchRes.timings.duration);
    orderErrors.add(searchRes.status !== 200);

    // Filter orders by status
    const filterRes = http.get(`${__ENV.API_URL}/api/orders`, {
      ...params,
      params: { status: 'processing' },
    });
    check(filterRes, {
      'filter orders 200': (r) => r.status === 200,
      'filter results valid': (r) => Array.isArray(r.json('orders')),
    });
    orderLatency.add(filterRes.timings.duration);
    orderErrors.add(filterRes.status !== 200);
  }

  // Test group: Batch Operations
  {
    // Batch status update
    const batchUpdateRes = http.post(`${__ENV.API_URL}/api/orders/batch`, {
      orderIds: ['test-order-1', 'test-order-2'],
      action: 'update_status',
      status: 'shipped',
    }, params);
    check(batchUpdateRes, {
      'batch update 200': (r) => r.status === 200,
      'batch update successful': (r) => r.json('success') === true,
    });
    orderLatency.add(batchUpdateRes.timings.duration);
    orderErrors.add(batchUpdateRes.status !== 200);
    orderUpdates.add(2);
  }

  sleep(1);
}

// Test teardown
export function teardown(data) {
  const logoutRes = http.post(`${__ENV.API_URL}/api/auth/logout`, null, {
    headers: { 'Authorization': `Bearer ${data.token}` },
  });
  
  check(logoutRes, {
    'logged out successfully': (r) => r.status === 200,
  });
} 