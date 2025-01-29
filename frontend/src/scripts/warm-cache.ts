import { CacheWarming } from '../lib/cacheWarming';
import { logger } from '../lib/logger';

async function warmCache() {
  logger.info('Starting cache warming process...');
  
  const warming = new CacheWarming({
    batchSize: 200,
    concurrency: 10,
    retryAttempts: 3,
    retryDelay: 1000
  });

  try {
    await warming.warmAll();
    logger.info('Cache warming completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Cache warming failed:', error);
    process.exit(1);
  }
}

warmCache(); 