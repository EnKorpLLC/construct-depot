import { z } from 'zod';

// Supplier Authentication Types
export enum AuthType {
  API_KEY = 'API_KEY',
  BASIC_AUTH = 'BASIC_AUTH',
  OAUTH2 = 'OAUTH2',
  FORM_LOGIN = 'FORM_LOGIN',
  CUSTOM = 'CUSTOM'
}

export interface SupplierCredentials {
  id: string;
  supplierId: string;
  authType: AuthType;
  credentials: Record<string, string>;
  lastUsed: Date;
  isValid: boolean;
}

// Crawler Configuration
export interface CrawlerConfig {
  id: string;
  supplierId: string;
  name: string;
  baseUrl: string;
  authType: AuthType;
  credentialsId: string;
  rateLimit: number; // requests per minute
  concurrency: number;
  selectors: ProductSelectors;
  endpoints?: ApiEndpoints;
  options: CrawlerOptions;
}

export interface ProductSelectors {
  listPage: {
    productContainer: string;
    nextPage?: string;
    pagination?: string;
  };
  productPage: {
    name: string;
    sku: string;
    price: string;
    description: string;
    category: string;
    stock?: string;
    specifications?: string;
    images: string;
  };
}

export interface ApiEndpoints {
  products?: string;
  categories?: string;
  inventory?: string;
  pricing?: string;
  auth?: string;
}

export interface CrawlerOptions {
  useHeadlessBrowser: boolean;
  followPagination: boolean;
  maxPages?: number;
  timeout: number;
  retryAttempts: number;
  downloadImages: boolean;
  updateFrequency: 'hourly' | 'daily' | 'weekly';
}

// Product Data Types
export interface CrawledProduct {
  externalId: string;
  name: string;
  sku: string;
  price: number;
  description: string;
  category: string;
  stock?: number;
  specifications?: Record<string, string>;
  images: string[];
  sourceUrl: string;
  supplierId: string;
  lastUpdated: Date;
}

// Crawler Job Types
export enum CrawlJobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface CrawlJob {
  id: string;
  configId: string;
  status: CrawlJobStatus;
  startTime: Date;
  endTime?: Date;
  productsProcessed: number;
  errors: CrawlError[];
  stats: CrawlStats;
}

export interface CrawlError {
  timestamp: Date;
  url: string;
  message: string;
  code: string;
  retryCount: number;
}

export interface CrawlStats {
  pagesProcessed: number;
  productsFound: number;
  productsUpdated: number;
  productsCreated: number;
  imagesProcessed: number;
  totalErrors: number;
  duration: number;
}

// Validation Schemas
export const crawlerConfigSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  authType: z.nativeEnum(AuthType),
  rateLimit: z.number().min(1).max(1000),
  concurrency: z.number().min(1).max(10),
  selectors: z.object({
    listPage: z.object({
      productContainer: z.string(),
      nextPage: z.string().optional(),
      pagination: z.string().optional(),
    }),
    productPage: z.object({
      name: z.string(),
      sku: z.string(),
      price: z.string(),
      description: z.string(),
      category: z.string(),
      stock: z.string().optional(),
      specifications: z.string().optional(),
      images: z.string(),
    }),
  }),
  options: z.object({
    useHeadlessBrowser: z.boolean(),
    followPagination: z.boolean(),
    maxPages: z.number().optional(),
    timeout: z.number(),
    retryAttempts: z.number(),
    downloadImages: z.boolean(),
    updateFrequency: z.enum(['hourly', 'daily', 'weekly']),
  }),
}); 