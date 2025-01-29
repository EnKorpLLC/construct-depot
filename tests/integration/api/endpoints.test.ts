import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../../src/app';
import { connectDatabase, disconnectDatabase } from '../../../src/database';
import { redisClient } from '../../../src/cache';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
    await redisClient.connect();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await redisClient.disconnect();
  });

  describe('Order Management API', () => {
    it('should create a new order', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          userId: '123',
          items: [{ productId: '1', quantity: 2 }]
        });

      expect(response.status).toBe(201);
      expect(response.body.order).toBeDefined();
    });

    it('should retrieve order details', async () => {
      const response = await request(app)
        .get('/api/orders/1');

      expect(response.status).toBe(200);
      expect(response.body.order).toBeDefined();
    });
  });

  describe('Analytics API', () => {
    it('should track events', async () => {
      const response = await request(app)
        .post('/api/analytics/events')
        .send({
          type: 'ORDER_CREATED',
          metadata: { orderId: '1' }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should generate reports', async () => {
      const response = await request(app)
        .get('/api/analytics/reports/daily');

      expect(response.status).toBe(200);
      expect(response.body.report).toBeDefined();
    });
  });

  describe('Cache Integration', () => {
    it('should cache frequently accessed data', async () => {
      // First request - should hit database
      const response1 = await request(app)
        .get('/api/products/popular');

      // Second request - should hit cache
      const response2 = await request(app)
        .get('/api/products/popular');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response2.header['x-cache-hit']).toBe('true');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          userId: '123',
          // Missing required items array
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests quickly
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/api/products')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});

export {}; 