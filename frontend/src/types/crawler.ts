import { z } from 'zod';

export interface CrawlTarget {
  id: string;
  url: string;
  selector: string;
  frequency: CrawlFrequency;
  lastCrawled?: Date;
  isActive: boolean;
  metadata: CrawlMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrawlMetadata {
  name: string;
  description?: string;
  priceSelector?: string;
  stockSelector?: string;
  titleSelector?: string;
  imageSelector?: string;
  customSelectors?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}

export interface CrawlResult {
  id: string;
  targetId: string;
  timestamp: Date;
  success: boolean;
  data: Record<string, any>;
  error?: string;
  duration: number;
  statusCode: number;
}

export enum CrawlFrequency {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

export interface CrawlSchedule {
  id: string;
  targetId: string;
  frequency: CrawlFrequency;
  customCron?: string;
  nextRun: Date;
  lastRun?: Date;
  isActive: boolean;
}

// Validation Schemas
export const crawlMetadataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  priceSelector: z.string().optional(),
  stockSelector: z.string().optional(),
  titleSelector: z.string().optional(),
  imageSelector: z.string().optional(),
  customSelectors: z.record(z.string()).optional(),
  headers: z.record(z.string()).optional(),
  cookies: z.record(z.string()).optional()
});

export const crawlTargetSchema = z.object({
  url: z.string().url('Invalid URL'),
  selector: z.string().min(1, 'Selector is required'),
  frequency: z.nativeEnum(CrawlFrequency),
  metadata: crawlMetadataSchema,
  customCron: z.string().optional().refine(
    (val) => !val || /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/.test(val),
    'Invalid cron expression'
  )
});

export const crawlResultSchema = z.object({
  targetId: z.string().uuid(),
  success: z.boolean(),
  data: z.record(z.any()),
  error: z.string().optional(),
  duration: z.number().min(0),
  statusCode: z.number()
}); 