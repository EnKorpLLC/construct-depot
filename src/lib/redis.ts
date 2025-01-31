import { Redis } from '@upstash/redis';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('Redis credentials are not properly configured');
}

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
}); 