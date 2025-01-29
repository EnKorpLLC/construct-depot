import logger from '../src/lib/logger';

async function testLogger() {
  console.log('Starting logger test...');

  logger.error('Test error message from script');
  logger.warn('Test warning message from script');
  logger.info('Test info message from script');
  logger.debug('Test debug message from script');
  logger.http('Test HTTP message from script');

  console.log('Logger test completed. Check the logs directory for output.');
}

testLogger(); 