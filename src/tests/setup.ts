import '@testing-library/jest-dom'
import { Session } from 'next-auth'
import { Role } from '@prisma/client'
import { Redis } from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { Headers } from 'next/dist/compiled/@edge-runtime/primitives'
import { NextRequest } from 'next/server'

// Mock setImmediate for test environment
if (typeof global.setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: Function, ...args: any[]) => setTimeout(fn, 0, ...args);
}

// Mock Request
class MockRequest {
  private _url: string;
  private _method: string;
  private _headers: Headers;
  private _body: any;

  constructor(input: string | URL | Request, init?: RequestInit) {
    this._url = input instanceof URL ? input.toString() : input instanceof Request ? input.url : input;
    this._method = init?.method || 'GET';
    this._headers = new Headers(init?.headers);
    this._body = init?.body;
  }

  get url() {
    return this._url;
  }

  get method() {
    return this._method;
  }

  get headers() {
    return this._headers;
  }

  get body() {
    return this._body;
  }

  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }

  async text() {
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
  }

  clone() {
    return new MockRequest(this._url, {
      method: this._method,
      headers: this._headers,
      body: this._body,
    });
  }
}

global.Request = MockRequest as any;

// Mock Response
class MockResponse {
  private body: any
  private init: ResponseInit

  constructor(body?: any, init?: ResponseInit) {
    this.body = body
    this.init = init || {}
  }

  get status() {
    return this.init.status || 200
  }

  get ok() {
    return this.status >= 200 && this.status < 300
  }

  async json() {
    return this.body
  }
}

global.Response = MockResponse as any;

// Mock Headers
class MockHeaders extends Map {
  append(key: string, value: string) {
    this.set(key, value);
  }

  delete(key: string): boolean {
    return super.delete(key);
  }

  get(key: string) {
    return super.get(key) || null;
  }

  has(key: string) {
    return super.has(key);
  }

  forEach(callbackfn: (value: any, key: any, map: Map<any, any>) => void, thisArg?: any): void {
    super.forEach(callbackfn, thisArg);
  }
}

global.Headers = MockHeaders as any

// Mock Redis
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  setex: jest.fn()
}

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedisClient)
}))

// Mock PrismaClient
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  }
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient)
}))

// Mock next-auth
export const MockSession: Session = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.user
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve(MockSession))
}))

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1
  url: string
  readyState: number = MockWebSocket.OPEN
  onopen: ((event: any) => void) | null = null
  onclose: ((event: any) => void) | null = null
  onmessage: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

  constructor(url: string) {
    this.url = url
  }

  send(data: string) {
    if (this.onmessage) {
      this.onmessage({ data })
    }
  }

  close() {
    if (this.onclose) {
      this.onclose({})
    }
  }
}

global.WebSocket = MockWebSocket as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  key: jest.fn(),
  length: 0
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock fetch
global.fetch = jest.fn()
global.Response = jest.fn() as any

// Mock Headers for NextRequest
global.Headers = class Headers extends Map {
  append(key: string, value: string) {
    this.set(key, value);
  }

  delete(key: string): boolean {
    return super.delete(key);
  }

  get(key: string) {
    return super.get(key) || null;
  }

  has(key: string) {
    return super.has(key);
  }

  set(key: string, value: string) {
    super.set(key, value);
    return this;
  }

  forEach(callback: (value: string, key: string, parent: Headers) => void) {
    super.forEach((value, key) => callback(value, key, this));
  }
} as any;

// Mock NextRequest
class MockNextRequest {
  private _url: URL;
  private _init: RequestInit;

  constructor(input: string | URL, init?: RequestInit) {
    this._url = typeof input === 'string' ? new URL(input) : input;
    this._init = init || {};
  }

  get url() {
    return this._url.toString();
  }

  get nextUrl() {
    return this._url;
  }

  get method() {
    return this._init.method || 'GET';
  }

  get headers() {
    return new Headers(this._init.headers);
  }

  async json() {
    return this._init.body ? JSON.parse(this._init.body as string) : null;
  }
}

(global as any).NextRequest = MockNextRequest;

// Export mocks for use in tests
export { mockRedisClient, mockPrismaClient }

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
}) 