import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import * as productsRoute from '@/app/api/products/route';
import * as productRoute from '@/app/api/products/[productId]/route';
import * as inventoryRoute from '@/app/api/products/[productId]/inventory/route';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: {
      id: 'test-supplier-id',
      role: 'SUPPLIER'
    }
  }))
}));

describe('Product Management API', () => {
  let testProduct: any;
  let testUser: any;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: await hash('password123', 12),
        role: 'SUPPLIER'
      }
    });

    // Create test product
    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        minOrderQuantity: 10,
        unit: 'pieces',
        categories: ['test'],
        specifications: {},
        currentStock: 100,
        supplierId: testUser.id
      }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /api/products', () => {
    it('should return list of products with pagination', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '10'
        }
      });

      await productsRoute.GET(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('products');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.products)).toBe(true);
    });

    it('should filter products by category', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          category: 'test'
        }
      });

      await productsRoute.GET(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.products).toHaveLength(1);
      expect(data.products[0].categories).toContain('test');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 149.99,
        minOrderQuantity: 5,
        unit: 'pieces',
        categories: ['new'],
        specifications: { color: 'red' }
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: productData
      });

      await productsRoute.POST(req);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(productData.name);
    });

    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Invalid Product'
          // Missing required fields
        }
      });

      await productsRoute.POST(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/products/[productId]', () => {
    it('should return product details', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await productRoute.GET(req, { params: { productId: testProduct.id } });

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.product.id).toBe(testProduct.id);
    });

    it('should return 404 for non-existent product', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await productRoute.GET(req, { params: { productId: 'non-existent-id' } });

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('PUT /api/products/[productId]', () => {
    it('should update product details', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 199.99
      };

      const { req, res } = createMocks({
        method: 'PUT',
        body: updateData
      });

      await productRoute.PUT(req, { params: { productId: testProduct.id } });

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.product.name).toBe(updateData.name);
      expect(data.product.price).toBe(updateData.price);
    });

    it('should prevent unauthorized updates', async () => {
      // Mock different user session
      require('next-auth').getServerSession.mockImplementationOnce(() =>
        Promise.resolve({
          user: {
            id: 'different-user-id',
            role: 'SUPPLIER'
          }
        })
      );

      const { req, res } = createMocks({
        method: 'PUT',
        body: { name: 'Unauthorized Update' }
      });

      await productRoute.PUT(req, { params: { productId: testProduct.id } });

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('DELETE /api/products/[productId]', () => {
    it('should soft delete product', async () => {
      const { req, res } = createMocks({
        method: 'DELETE'
      });

      await productRoute.DELETE(req, { params: { productId: testProduct.id } });

      expect(res._getStatusCode()).toBe(200);
      
      // Verify product is soft deleted
      const deletedProduct = await prisma.product.findUnique({
        where: { id: testProduct.id }
      });
      expect(deletedProduct?.isActive).toBe(false);
    });
  });

  describe('PATCH /api/products/[productId]/inventory', () => {
    it('should update stock levels', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          adjustment: 50,
          type: 'RESTOCK',
          reason: 'Test restock'
        }
      });

      await inventoryRoute.PATCH(req, { params: { productId: testProduct.id } });

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.product.currentStock).toBe(testProduct.currentStock + 50);
    });

    it('should prevent negative stock', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          adjustment: -150, // More than current stock
          type: 'SALE'
        }
      });

      await inventoryRoute.PATCH(req, { params: { productId: testProduct.id } });

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Insufficient stock');
    });
  });

  describe('GET /api/products/[productId]/inventory', () => {
    it('should return inventory history', async () => {
      // Create some inventory logs
      await prisma.inventoryLog.createMany({
        data: [
          {
            productId: testProduct.id,
            type: 'RESTOCK',
            quantity: 50,
            createdBy: testUser.id
          },
          {
            productId: testProduct.id,
            type: 'SALE',
            quantity: -10,
            createdBy: testUser.id
          }
        ]
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      await inventoryRoute.GET(req, { params: { productId: testProduct.id } });

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.logs).toHaveLength(2);
      expect(data).toHaveProperty('pagination');
    });
  });
}); 