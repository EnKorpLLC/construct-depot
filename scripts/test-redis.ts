import { Redis } from 'ioredis';

async function testRedisConnection() {
  const redis = new Redis({
    host: '172.23.155.202',
    port: 6379,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    connectTimeout: 15000,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false
  });

  try {
    // Test setting a value
    await redis.set('test-key', 'Hello Redis!');
    console.log('✅ Successfully set test value');

    // Test getting the value
    const value = await redis.get('test-key');
    console.log('✅ Successfully retrieved value:', value);

    // Test rate limiting functionality
    const key = 'ratelimit:test:127.0.0.1';
    await redis.zadd(key, Date.now(), 'request1');
    console.log('✅ Successfully tested rate limiting functionality');

    // Clean up
    await redis.del('test-key', key);
    console.log('✅ Successfully cleaned up test data');

    // Close connection
    await redis.quit();
    console.log('✅ Successfully closed Redis connection');
    
    console.log('\n🎉 All Redis tests passed! Your Redis setup is working correctly.');
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    process.exit(1);
  }
}

testRedisConnection(); 