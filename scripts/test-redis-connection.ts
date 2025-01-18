console.log('Testing Redis connection...');

import { createClient } from 'redis';

async function testRedisConnection() {
  const client = createClient({ url: process.env.REDIS_URL });

  client.on('error', (err) => console.error('Redis Client Error', err));

  try {
    await client.connect();
    console.log('✅ Redis connection successful');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
  } finally {
    await client.disconnect();
  }
}

testRedisConnection(); 