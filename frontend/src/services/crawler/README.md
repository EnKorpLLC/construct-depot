# AI Specialty Web Crawler

A powerful and configurable web crawler service designed for extracting product data from supplier websites.

## Features

- Automated supplier website crawling
- Multiple authentication methods support
- Rate limiting and request throttling
- Image processing and storage
- Product matching and deduplication
- Real-time progress tracking
- Scheduled crawling
- Error handling and recovery
- Configurable selectors for different website structures

## Architecture

The crawler service is built with a modular architecture consisting of several key components:

### Core Components

1. **CrawlerService**: Main service class that orchestrates the crawling process
2. **AuthManager**: Handles different authentication methods
3. **ImageProcessor**: Processes and stores product images
4. **ProductMatcher**: Matches and deduplicates products
5. **RateLimiter**: Controls request rates to prevent overloading

### Configuration

The crawler is highly configurable through the `CrawlerConfig` interface:

```typescript
interface CrawlerConfig {
  name: string;
  description: string;
  targetUrl: string;
  schedule?: ScheduleConfig;
  rateLimit: number;
  authType: AuthType;
  selectors: ProductSelectors;
  options: CrawlerOptions;
}
```

### Usage

1. Create a crawler configuration:
```typescript
const config: CrawlerConfig = {
  name: "Supplier Crawler",
  targetUrl: "https://supplier.com",
  rateLimit: 30,
  authType: AuthType.FORM_LOGIN,
  selectors: {
    listPage: {
      productContainer: ".product-item",
      nextPage: ".pagination .next"
    },
    productPage: {
      name: ".product-name",
      price: ".product-price",
      // ... other selectors
    }
  },
  options: {
    useHeadlessBrowser: true,
    followPagination: true,
    maxPages: 10
  }
};
```

2. Initialize and start the crawler:
```typescript
const crawler = new CrawlerService(config, job);
await crawler.start();
```

## Error Handling

The crawler implements comprehensive error handling:

1. Network errors: Automatic retries with configurable attempts
2. Authentication failures: Detailed error reporting
3. Parsing errors: Graceful degradation with partial results
4. Rate limiting: Automatic request throttling

## Monitoring

Monitor crawling progress through:

1. Real-time status updates
2. Progress percentage
3. Success rate calculation
4. Error logging
5. Performance metrics

## Best Practices

1. **Rate Limiting**
   - Set appropriate rate limits based on supplier requirements
   - Use the built-in rate limiter to prevent overloading

2. **Selectors**
   - Use specific CSS selectors
   - Test selectors before deployment
   - Include fallback selectors where possible

3. **Error Handling**
   - Implement proper error recovery
   - Log all errors for debugging
   - Set appropriate timeout values

4. **Performance**
   - Use headless mode when possible
   - Implement proper caching
   - Optimize image processing

## Testing

Run the test suite:

```bash
npm run test:crawler
```

The test suite covers:
- Service initialization
- Authentication
- Data extraction
- Error handling
- Progress tracking

## Troubleshooting

Common issues and solutions:

1. **Authentication Failures**
   - Verify credentials
   - Check authentication type
   - Review network requests

2. **Selector Issues**
   - Validate selector syntax
   - Check for website structure changes
   - Use browser dev tools to test

3. **Performance Issues**
   - Adjust rate limiting
   - Optimize image processing
   - Review resource usage

## API Reference

### CrawlerService

```typescript
class CrawlerService {
  constructor(config: CrawlerConfig, job: CrawlerJob);
  async start(): Promise<void>;
  async stop(): Promise<void>;
  private async initialize(): Promise<void>;
  private async authenticate(): Promise<void>;
  private async crawl(): Promise<void>;
  // ... other methods
}
```

### Utility Classes

```typescript
class RateLimiter {
  constructor(requestsPerMinute: number);
  async wait(): Promise<void>;
}

class AuthManager {
  async authenticate(page: Page, type: AuthType, credentials: any): Promise<void>;
}

// ... other utility classes
``` 