import Redis from 'ioredis';
import { execSync } from 'child_process';

interface RedisNode {
  host: string;
  port: number;
}

const REDIS_NODES: RedisNode[] = [
  { host: process.env.REDIS_HOST_1 || 'localhost', port: 6379 },
  { host: process.env.REDIS_HOST_2 || 'localhost', port: 6380 },
  { host: process.env.REDIS_HOST_3 || 'localhost', port: 6381 }
];

async function setupRedisCluster() {
  try {
    console.log('Starting Redis cluster setup...');

    // Create Redis cluster
    const cluster = new Redis.Cluster(REDIS_NODES, {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        tls: process.env.NODE_ENV === 'production' ? {} : undefined
      },
      scaleReads: 'slave',
      maxRedirections: 16,
      retryDelayOnFailover: 2000
    });

    // Test cluster connection
    console.log('Testing cluster connection...');
    await cluster.set('test_key', 'test_value');
    const testValue = await cluster.get('test_key');
    if (testValue !== 'test_value') {
      throw new Error('Cluster test failed');
    }

    // Configure persistence
    console.log('Configuring persistence...');
    await Promise.all(REDIS_NODES.map(async node => {
      const redis = new Redis(node.port, node.host, {
        password: process.env.REDIS_PASSWORD
      });
      await redis.config('SET', 'appendonly', 'yes');
      await redis.config('SET', 'appendfsync', 'everysec');
      await redis.quit();
    }));

    // Configure monitoring
    console.log('Setting up monitoring...');
    await cluster.config('SET', 'notify-keyspace-events', 'AKE');

    // Set up key eviction policy
    console.log('Configuring eviction policy...');
    await cluster.config('SET', 'maxmemory-policy', 'volatile-lru');
    await cluster.config('SET', 'maxmemory', '2gb');

    console.log('Redis cluster setup completed successfully');
    await cluster.quit();
  } catch (error) {
    console.error('Error setting up Redis cluster:', error);
    process.exit(1);
  }
}

async function verifyClusterHealth() {
  try {
    console.log('Verifying cluster health...');
    
    // Check each node
    for (const node of REDIS_NODES) {
      const redis = new Redis(node.port, node.host, {
        password: process.env.REDIS_PASSWORD
      });
      
      // Check memory usage
      const info = await redis.info('memory');
      console.log(`Node ${node.host}:${node.port} memory info:`, info);
      
      // Check replication status
      const replInfo = await redis.info('replication');
      console.log(`Node ${node.host}:${node.port} replication info:`, replInfo);
      
      await redis.quit();
    }
    
    console.log('Cluster health verification completed');
  } catch (error) {
    console.error('Error verifying cluster health:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  (async () => {
    await setupRedisCluster();
    await verifyClusterHealth();
  })();
}

export { setupRedisCluster, verifyClusterHealth }; 