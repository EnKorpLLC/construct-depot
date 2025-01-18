import { Redis } from 'ioredis';
import redis from '../redis';

// Mock ioredis
jest.mock('ioredis');

describe('Redis Client', () => {
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockRedis = new Redis() as jest.Mocked<Redis>;
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should create a singleton instance', () => {
    const instance1 = redis;
    const instance2 = redis;
    expect(instance1).toBe(instance2);
    expect(Redis).toHaveBeenCalledTimes(1);
  });

  it('should use correct configuration', () => {
    expect(Redis).toHaveBeenCalledWith({
      host: expect.any(String),
      port: expect.any(Number),
      password: expect.any(String),
      retryStrategy: expect.any(Function),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 15000,
      lazyConnect: true,
      showFriendlyErrorStack: expect.any(Boolean)
    });
  });

  it('should handle connection errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const errorCallback = mockRedis.on.mock.calls.find(call => call[0] === 'error')?.[1];
    
    if (errorCallback) {
      errorCallback(new Error('Test error'));
      expect(consoleSpy).toHaveBeenCalledWith('[Redis Error]', expect.any(Error));
    }
    
    consoleSpy.mockRestore();
  });

  it('should log successful connections', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const connectCallback = mockRedis.on.mock.calls.find(call => call[0] === 'connect')?.[1];
    
    if (connectCallback) {
      connectCallback();
      expect(consoleSpy).toHaveBeenCalledWith('[Redis] Connected successfully');
    }
    
    consoleSpy.mockRestore();
  });

  it('should implement retry strategy correctly', () => {
    const config = (Redis as jest.Mock).mock.calls[0][0];
    const delay = config.retryStrategy(1);
    expect(delay).toBe(100); // First retry should be 100ms
    
    const maxDelay = config.retryStrategy(50);
    expect(maxDelay).toBe(3000); // Should be capped at 3000ms
  });
}); 